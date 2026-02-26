import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from '../../utils/logger';
import { COLLECTIONS } from '../../shared/constants';

const db = getFirestore();

/**
 * Public unsubscribe endpoint. Accessed via GET with a leadId query param.
 * GET /unsubscribeEmail?id=<leadId>
 *
 * CAN-SPAM compliant: one-click unsubscribe, no login required.
 */
export const unsubscribeEmail = onRequest(async (req, res) => {
  const leadId = req.query.id as string;

  if (!leadId) {
    res.status(400).send(renderPage('Missing unsubscribe ID.', false));
    return;
  }

  try {
    const leadRef = db.collection(COLLECTIONS.leads).doc(leadId);
    const leadDoc = await leadRef.get();

    if (!leadDoc.exists) {
      res.status(200).send(renderPage('You have been unsubscribed.', true));
      return;
    }

    const lead = leadDoc.data()!;

    if (lead.status === 'unsubscribed') {
      res.status(200).send(renderPage('You are already unsubscribed.', true));
      return;
    }

    await leadRef.update({
      status: 'unsubscribed',
      nextEmailAt: null,
      updatedAt: Timestamp.now(),
    });

    // Log the event
    await db.collection(COLLECTIONS.emailEvents).add({
      leadId,
      leadEmail: lead.email || '',
      sequenceId: lead.sequenceId || null,
      stepNumber: lead.sequenceStep ?? null,
      type: 'complained',
      metadata: { source: 'unsubscribe_link' },
      timestamp: Timestamp.now(),
    });

    logger.info('Lead unsubscribed via link', { leadId, email: lead.email });
    res.status(200).send(renderPage('You have been successfully unsubscribed. You will no longer receive emails from PropWise.', true));
  } catch (error) {
    logger.error('Unsubscribe error', {
      leadId,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    res.status(500).send(renderPage('Something went wrong. Please try again or contact support.', false));
  }
});

function renderPage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe - PropWise</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #faf9f7; color: #1a1a2e; }
    .card { max-width: 400px; padding: 40px; text-align: center; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 20px; margin: 0 0 12px; }
    p { font-size: 14px; color: #64748b; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✓' : '⚠'}</div>
    <h1>${success ? 'Unsubscribed' : 'Error'}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
