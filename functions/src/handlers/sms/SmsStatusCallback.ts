import { onRequest } from 'firebase-functions/v2/https';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { requireTwilioSignature } from '../../middleware/twilio.middleware';
import { COLLECTIONS } from '../../shared';

export const smsStatusCallback = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  if (!requireTwilioSignature(req, res)) return;

  const { MessageSid: sid, MessageStatus: status } = req.body;

  logger.info('SMS status update', { sid, status });

  try {
    // Find and update the message by Twilio SID
    const messageSnap = await db
      .collection(COLLECTIONS.messages)
      .where('twilioSid', '==', sid)
      .limit(1)
      .get();

    if (!messageSnap.empty) {
      await messageSnap.docs[0].ref.update({ status });
    }
  } catch (error) {
    logger.error('Error updating SMS status', { error, sid });
  }

  res.status(200).send('OK');
});
