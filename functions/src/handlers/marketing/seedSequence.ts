import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from '../../utils/logger';
import { COLLECTIONS, getMarketingAdminEmails } from '../../shared/constants';

const db = getFirestore();

function requireMarketingAdmin(email?: string): void {
  if (!email || !getMarketingAdminEmails().includes(email.toLowerCase())) {
    throw new HttpsError('permission-denied', 'Not authorized for marketing');
  }
}

export const seedEmailSequence = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
  requireMarketingAdmin(request.auth.token.email);

  // Check if default sequence already exists
  const existing = await db.collection(COLLECTIONS.emailSequences)
    .where('isDefault', '==', true)
    .limit(1)
    .get();

  if (!existing.empty) {
    return { sequenceId: existing.docs[0].id, message: 'Default sequence already exists' };
  }

  const ref = db.collection(COLLECTIONS.emailSequences).doc();
  await ref.set({
    name: 'PropWise Cold Outreach',
    description: '4-step cold email drip based on property management pain points',
    isDefault: true,
    steps: [
      {
        stepNumber: 0,
        dayOffset: 0,
        variant: 'pain_point',
        subjectTemplate: '{{name}}, your tenants are texting at 2 AM',
        bodyTemplate: `<p>Hi {{name}},</p>
<p>I've been talking to PMs who manage portfolios like {{company}}'s, and there's one thing that keeps coming up — the after-hours texts.</p>
<p>Tenants don't care that it's 2 AM when their toilet is overflowing. And you shouldn't have to be the one answering at 2 AM either.</p>
<p>We built PropWise to handle those conversations automatically — triaging emergencies, creating work orders, and keeping tenants in the loop — so you can actually sleep through the night.</p>
<p>Would it be worth a quick look? I can show you how it works in 15 minutes.</p>
<p>— The PropWise Team</p>
<p style="font-size:12px;color:#666;">{{unsubscribe}} | {{address}}</p>`,
      },
      {
        stepNumber: 1,
        dayOffset: 3,
        variant: 'follow_up',
        subjectTemplate: 'Quick follow-up',
        bodyTemplate: `<p>Hi {{name}},</p>
<p>Just bumping this up — wanted to make sure it didn't get buried.</p>
<p>We help PMs automate the tenant communication that eats up 20+ hours a week. Everything from maintenance requests to rent reminders, handled via SMS.</p>
<p>If you're curious, I'd love to walk you through a quick demo.</p>
<p>— The PropWise Team</p>
<p style="font-size:12px;color:#666;">{{unsubscribe}} | {{address}}</p>`,
      },
      {
        stepNumber: 2,
        dayOffset: 7,
        variant: 'roi',
        subjectTemplate: '{{company}} could save 22+ hours/week',
        bodyTemplate: `<p>Hi {{name}},</p>
<p>One of our PMs manages {{portfolioSize}} units and told us they were spending 25+ hours a week just on tenant communication — texts, calls, emails about the same stuff over and over.</p>
<p>After switching to PropWise, they got that down to about 3 hours. The AI handles the repetitive stuff, and they only step in when it actually matters.</p>
<p>I don't know if your situation is exactly the same, but if {{company}} is dealing with similar volume, it might be worth a conversation.</p>
<p>Open to a quick 15-minute call this week?</p>
<p>— The PropWise Team</p>
<p style="font-size:12px;color:#666;">{{unsubscribe}} | {{address}}</p>`,
      },
      {
        stepNumber: 3,
        dayOffset: 14,
        variant: 'breakup',
        subjectTemplate: 'Closing the loop',
        bodyTemplate: `<p>Hi {{name}},</p>
<p>I've reached out a couple times and haven't heard back — totally get it, you're busy managing properties, not reading cold emails.</p>
<p>I'll stop reaching out after this, but if tenant communication ever becomes a bottleneck for {{company}}, we'll be here.</p>
<p>PropWise automates SMS-based tenant interactions — maintenance, rent reminders, emergency triage — so PMs can focus on growing their portfolio instead of answering texts.</p>
<p>If the timing's ever right, just reply to this email.</p>
<p>All the best,<br/>The PropWise Team</p>
<p style="font-size:12px;color:#666;">{{unsubscribe}} | {{address}}</p>`,
      },
    ],
    createdAt: Timestamp.now(),
  });

  logger.info('Default email sequence seeded', { sequenceId: ref.id });
  return { sequenceId: ref.id, message: 'Default sequence created' };
});
