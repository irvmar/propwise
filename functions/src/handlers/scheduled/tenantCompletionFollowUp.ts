import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { sendSms } from '../../services/twilio.service';
import { COLLECTIONS, SMS_TEMPLATES, WorkOrder, Tenant } from '../../shared';

const Timestamp = admin.firestore.Timestamp;
const FieldValue = admin.firestore.FieldValue;

/**
 * Runs daily at 6 PM ET. Checks for work orders that:
 * 1. Were scheduled for today or yesterday (giving vendor time to complete)
 * 2. Are still in 'scheduled' or 'in_progress' status
 *
 * Sends a follow-up SMS to the tenant asking if the repair was completed.
 */
export const tenantCompletionFollowUp = onSchedule(
  { schedule: '0 18 * * *', timeZone: 'America/New_York' },
  async () => {
    logger.info('Running tenant completion follow-up check');

    // Look for work orders scheduled in the past 48 hours
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Find work orders that were scheduled and might be done
    const woSnap = await db
      .collection(COLLECTIONS.workOrders)
      .where('status', 'in', ['scheduled', 'in_progress'])
      .get();

    let followUpsSent = 0;

    for (const woDoc of woSnap.docs) {
      const wo = { id: woDoc.id, ...woDoc.data() } as WorkOrder;

      // Only follow up on work orders that have a scheduled date in the past
      if (!wo.scheduledDate) continue;

      const scheduledDate = new Date(wo.scheduledDate);
      if (scheduledDate > now || scheduledDate < twoDaysAgo) continue;

      // Check if we already sent a follow-up (avoid double-texting)
      const hasFollowUpNote = wo.notes?.some(
        (n) => n.body.includes('Completion follow-up sent'),
      );
      if (hasFollowUpNote) continue;

      try {
        // Load tenant
        const tenantDoc = await db
          .collection(COLLECTIONS.tenants)
          .doc(wo.tenantId)
          .get();

        if (!tenantDoc.exists) continue;
        const tenant = tenantDoc.data() as Tenant;

        // Skip opted-out tenants
        if (tenant.smsOptedOut === true) continue;

        // Send follow-up
        await sendSms(
          tenant.phone,
          SMS_TEMPLATES.tenantCompletionFollowUp(tenant.firstName, wo.title),
        );

        // Record that we sent the follow-up
        await woDoc.ref.update({
          updatedAt: Timestamp.now(),
          notes: FieldValue.arrayUnion({
            id: db.collection('_').doc().id,
            authorId: 'system',
            authorName: 'System',
            body: 'Completion follow-up sent to tenant.',
            createdAt: Timestamp.now(),
          }),
        });

        followUpsSent++;

        logger.info('Completion follow-up sent', {
          workOrderId: wo.id,
          tenantId: wo.tenantId,
        });
      } catch (error) {
        logger.error('Failed to send completion follow-up', {
          workOrderId: wo.id,
          error,
        });
      }
    }

    logger.info('Tenant completion follow-up complete', { followUpsSent });
  },
);
