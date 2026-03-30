import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from '../../utils/logger';
import { COLLECTIONS } from '../../shared/constants';
import { generateStructured } from '../../services/claude.service';
import { sendEmail } from '../../services/resend.service';
import { getEmailInsights, getLeadSegmentInsights } from '../../services/marketing-insights.service';

const db = getFirestore();

// Build unsubscribe URL using the Cloud Functions base URL
function getUnsubscribeUrl(leadId: string): string {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'propwise-ai';
  const region = process.env.FUNCTION_REGION || 'us-central1';
  return `https://${region}-${projectId}.cloudfunctions.net/unsubscribeEmail?id=${encodeURIComponent(leadId)}`;
}

const PHYSICAL_ADDRESS = process.env.COMPANY_ADDRESS || 'PropWise AI, 123 Main Street, Suite 100, Austin, TX 78701';

export const processEmailDrips = onSchedule(
  {
    schedule: '30 8 * * 1-5',
    timeZone: 'America/New_York',
    timeoutSeconds: 540,
    memory: '1GiB',
  },
  async () => {
    const now = Timestamp.now();

    // Get leads ready for their next email
    const leadsSnap = await db.collection(COLLECTIONS.leads)
      .where('status', 'in', ['new', 'nurturing'])
      .where('nextEmailAt', '<=', now)
      .limit(50)
      .get();

    if (leadsSnap.empty) {
      logger.info('No leads ready for drip emails');
      return;
    }

    logger.info('Processing email drips', { count: leadsSnap.size });

    // Fetch performance insights once for the entire batch
    const [emailInsights, segmentInsights] = await Promise.all([
      getEmailInsights(),
      getLeadSegmentInsights(),
    ]);
    logger.info('Performance insights loaded for email personalization');

    for (const leadDoc of leadsSnap.docs) {
      try {
        const lead = leadDoc.data();

        // Get sequence
        if (!lead.sequenceId) continue;
        const seqDoc = await db.collection(COLLECTIONS.emailSequences).doc(lead.sequenceId).get();
        if (!seqDoc.exists) continue;

        const sequence = seqDoc.data()!;
        const currentStep = sequence.steps.find(
          (s: { stepNumber: number }) => s.stepNumber === lead.sequenceStep,
        );

        if (!currentStep) {
          // Sequence complete
          await leadDoc.ref.update({
            status: lead.score >= 30 ? 'hot' : 'nurturing',
            nextEmailAt: null,
            updatedAt: Timestamp.now(),
          });
          continue;
        }

        // Personalize with Claude
        const unsubscribeUrl = getUnsubscribeUrl(leadDoc.id);
        const { subject, html } = await personalizeEmail(currentStep, lead, leadDoc.id, unsubscribeUrl, emailInsights, segmentInsights);

        // Send via Resend with List-Unsubscribe header for one-click unsubscribe
        const { id: resendId } = await sendEmail({
          to: lead.email,
          subject,
          html,
          tags: [
            { name: 'leadId', value: leadDoc.id },
            { name: 'sequence', value: lead.sequenceId },
            { name: 'step', value: String(currentStep.stepNumber) },
          ],
        });

        // Log email event (only 'sent' — Resend webhook handles delivered/opened/clicked)
        await db.collection(COLLECTIONS.emailEvents).add({
          leadId: leadDoc.id,
          leadEmail: lead.email,
          sequenceId: lead.sequenceId,
          stepNumber: currentStep.stepNumber,
          type: 'sent',
          resendEmailId: resendId,
          timestamp: Timestamp.now(),
        });

        // Advance to next step
        const nextStep = sequence.steps.find(
          (s: { stepNumber: number }) => s.stepNumber === currentStep.stepNumber + 1,
        );

        const updateData: Record<string, unknown> = {
          sequenceStep: currentStep.stepNumber + 1,
          lastEmailAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        if (nextStep) {
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + (nextStep.dayOffset - currentStep.dayOffset));
          updateData.nextEmailAt = Timestamp.fromDate(nextDate);
          updateData.status = 'nurturing';
        } else {
          updateData.nextEmailAt = null;
          updateData.status = lead.score >= 30 ? 'hot' : 'nurturing';
        }

        await leadDoc.ref.update(updateData);

        logger.info('Drip email sent', {
          leadId: leadDoc.id,
          step: currentStep.stepNumber,
          resendId,
        });
      } catch (error) {
        logger.error('Error processing lead drip', {
          leadId: leadDoc.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  },
);

async function personalizeEmail(
  step: { subjectTemplate: string; bodyTemplate: string; variant: string; stepNumber?: number },
  lead: Record<string, unknown>,
  leadId: string,
  unsubscribeUrl: string,
  emailInsights: string,
  segmentInsights: string,
): Promise<{ subject: string; html: string }> {
  const name = typeof lead.name === 'string' ? lead.name : 'there';
  const company = typeof lead.company === 'string' ? lead.company : 'your company';
  const portfolioSize = typeof lead.portfolioSize === 'number' ? lead.portfolioSize : 50;
  const market = typeof lead.market === 'string' ? lead.market : '';

  // Determine personalization angle by portfolio size
  let sizeAngle = 'how much time you could save each week';
  if (portfolioSize < 50) {
    sizeAngle = 'getting back your evenings and weekends';
  } else if (portfolioSize >= 200) {
    sizeAngle = 'keeping communication consistent across your whole portfolio';
  }

  const unsubscribeHtml = `<a href="${unsubscribeUrl}" style="color:#999;text-decoration:underline;">Unsubscribe</a>`;
  const footer = `<p style="font-size:12px;color:#666;margin-top:32px;">${unsubscribeHtml} | ${PHYSICAL_ADDRESS}</p>`;

  const stepNum = step.stepNumber ?? 0;

  const systemPrompt = `You are writing a cold email for PropWise, an AI-powered property management communication tool.

RULES:
- Write like a real human. Use contractions. Vary sentence length. Be conversational.
- BANNED phrases: "I hope this email finds you well", "synergy", "circle back", "touch base", "reaching out", "just checking in" (except in breakup email)
- Subject line MUST be under 60 characters. No ALL CAPS words.
- Personalize based on: name="${name}", company="${company}", portfolio ~${portfolioSize} units${market ? `, market="${market}"` : ''}
- Focus angle for this portfolio size: ${sizeAngle}
- DO NOT include unsubscribe links or physical address — those are added automatically after your output.
- Output ONLY valid JSON: {"subject": "...", "html": "..."}
- The HTML should use simple <p> tags, no fancy styling

PERFORMANCE DATA — Use this to adjust your approach. Lean into what works, avoid what doesn't:
This is email step ${stepNum} for a lead managing ~${portfolioSize} units.

Email performance by step:
${emailInsights}

Lead segment performance:
${segmentInsights}`;

  const userMessage = `Personalize this ${step.variant} email.

Subject template: ${step.subjectTemplate}
Body template: ${step.bodyTemplate}

Make it feel genuine and specific to this lead. Don't just do find-and-replace — rewrite sections to feel natural for someone managing ~${portfolioSize} units.`;

  const emailSchema = {
    name: 'create_email',
    description: 'Create a personalized cold email with subject and HTML body',
    input_schema: {
      type: 'object' as const,
      properties: {
        subject: { type: 'string', description: 'Email subject line, under 60 characters' },
        html: { type: 'string', description: 'Email body in simple HTML with <p> tags' },
      },
      required: ['subject', 'html'],
    },
  };

  try {
    const { data } = await generateStructured<{ subject: string; html: string }>(
      systemPrompt,
      userMessage,
      emailSchema,
      { maxTokens: 1500 },
    );
    if (data.subject && data.html) {
      return { subject: data.subject, html: data.html + footer };
    }
  } catch (err) {
    logger.warn('Claude personalization failed, falling back to template replacement', {
      error: err instanceof Error ? err.message : 'Unknown',
    });
  }

  // Fallback: simple template variable replacement
  const subject = step.subjectTemplate
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{company\}\}/g, company)
    .replace(/\{\{portfolioSize\}\}/g, String(portfolioSize));

  let html = step.bodyTemplate
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{company\}\}/g, company)
    .replace(/\{\{portfolioSize\}\}/g, String(portfolioSize));

  // Replace template CAN-SPAM placeholders and append footer
  html = html
    .replace(/<p[^>]*>.*?\{\{unsubscribe\}\}.*?\{\{address\}\}.*?<\/p>/g, '')
    .replace(/\{\{unsubscribe\}\}/g, '')
    .replace(/\{\{address\}\}/g, '');

  return { subject, html: html + footer };
}
