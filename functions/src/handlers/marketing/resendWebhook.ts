import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Webhook } from 'svix';
import { logger } from '../../utils/logger';
import { COLLECTIONS } from '../../shared/constants';

const db = getFirestore();

function verifyWebhookSignature(req: { headers: Record<string, string | string[] | undefined>; body: unknown }): void {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('RESEND_WEBHOOK_SECRET not configured');
  }

  const svixId = req.headers['svix-id'] as string;
  const svixTimestamp = req.headers['svix-timestamp'] as string;
  const svixSignature = req.headers['svix-signature'] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error('Missing Svix webhook headers');
  }

  const wh = new Webhook(secret);
  const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  wh.verify(payload, {
    'svix-id': svixId,
    'svix-timestamp': svixTimestamp,
    'svix-signature': svixSignature,
  });
}

export const resendWebhook = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  // Verify webhook signature
  try {
    verifyWebhookSignature(req);
  } catch (err) {
    logger.warn('Resend webhook signature verification failed', {
      error: err instanceof Error ? err.message : 'Unknown',
    });
    res.status(401).send('Invalid signature');
    return;
  }

  try {
    const event = req.body;
    const eventType = event.type as string;

    const typeMap: Record<string, string> = {
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
    };

    const ourType = typeMap[eventType];
    if (!ourType) {
      logger.info('Ignoring unhandled Resend event type', { eventType });
      res.status(200).send('OK');
      return;
    }

    // Resend sends tags as an array of {name, value} objects
    const tagsArr: Array<{ name: string; value: string }> = event.data?.tags || [];
    const tags: Record<string, string> = {};
    for (const t of tagsArr) {
      tags[t.name] = t.value;
    }

    const leadId = tags.leadId;
    const sequenceId = tags.sequence;
    const stepNumber = tags.step ? parseInt(tags.step, 10) : undefined;

    // Log event
    await db.collection(COLLECTIONS.emailEvents).add({
      leadId: leadId || null,
      leadEmail: event.data?.to?.[0] || event.data?.email || '',
      sequenceId: sequenceId || null,
      stepNumber: stepNumber ?? null,
      type: ourType,
      resendEmailId: event.data?.email_id || null,
      metadata: {
        resendEventType: eventType,
        ...(event.data?.click?.link ? { clickedLink: event.data.click.link } : {}),
      },
      timestamp: Timestamp.now(),
    });

    // Update lead score using transaction to avoid race conditions (M5 fix)
    if (leadId) {
      const leadRef = db.collection(COLLECTIONS.leads).doc(leadId);

      let transitionedToHot = false;
      let hotLeadData: { name: string; email: string; company?: string; score: number; source: string } | null = null;

      await db.runTransaction(async (txn) => {
        const leadDoc = await txn.get(leadRef);
        if (!leadDoc.exists) return;

        const lead = leadDoc.data()!;
        const currentScore = lead.score || 0;
        const previousStatus = lead.status;
        const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };

        switch (ourType) {
          case 'opened': {
            const newScore = currentScore + 5;
            updates.score = newScore;
            if (newScore >= 30 && previousStatus !== 'hot' && previousStatus !== 'converted') {
              updates.status = 'hot';
              transitionedToHot = true;
              hotLeadData = {
                name: lead.name || 'Unknown',
                email: lead.email || '',
                company: lead.company,
                score: newScore,
                source: lead.source || 'unknown',
              };
            }
            break;
          }
          case 'clicked': {
            const newScore = currentScore + 15;
            updates.score = newScore;
            if (newScore >= 30 && previousStatus !== 'hot' && previousStatus !== 'converted') {
              updates.status = 'hot';
              transitionedToHot = true;
              hotLeadData = {
                name: lead.name || 'Unknown',
                email: lead.email || '',
                company: lead.company,
                score: newScore,
                source: lead.source || 'unknown',
              };
            }
            break;
          }
          case 'bounced':
            updates.score = currentScore - 100;
            updates.status = 'bounced';
            updates.nextEmailAt = null;
            break;
          case 'complained':
            updates.score = currentScore - 100;
            updates.status = 'unsubscribed';
            updates.nextEmailAt = null;
            break;
        }

        txn.update(leadRef, updates);
      });

      // Notify on hot lead transition only (fire-and-forget, outside transaction)
      if (transitionedToHot && hotLeadData) {
        const leadInfo = hotLeadData;
        import('../../services/telegram.service')
          .then(({ notifyHotLead }) => notifyHotLead(leadInfo))
          .catch(() => {}); // Silent — notification is non-critical
      }

      logger.info('Lead updated from webhook', { leadId, eventType: ourType });
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Resend webhook error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).send('Internal error');
  }
});
