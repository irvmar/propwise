import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { sendSms } from '../../services/twilio.service';
import { COLLECTIONS, SMS_TEMPLATES, Organization, Vendor, WorkOrder } from '../../shared';
import { dispatchToNextVendor } from '../sms/VendorIncomingSms';

const Timestamp = admin.firestore.Timestamp;
const FieldValue = admin.firestore.FieldValue;

const STALE_DAYS = 3;
const VENDOR_TIMEOUT_HOURS = 2;

export const followUpWorkOrders = onSchedule(
  { schedule: '0 9 * * 1-5', timeZone: 'America/New_York' },
  async () => {
    // ── 1. Vendor timeout escalation (2-hour window) ────────────────────
    await escalateTimedOutVendors();

    // ── 2. Stale work order flagging (3-day window) ─────────────────────
    await flagStaleWorkOrders();
  },
);

/**
 * Finds work orders stuck in `vendor_contacted` status for more than
 * VENDOR_TIMEOUT_HOURS. For each, tries the next available vendor or
 * escalates to the property manager.
 */
async function escalateTimedOutVendors(): Promise<void> {
  logger.info('Checking for vendor timeout escalations');

  const timeoutCutoff = new Date();
  timeoutCutoff.setHours(timeoutCutoff.getHours() - VENDOR_TIMEOUT_HOURS);

  const timedOutOrders = await db
    .collection(COLLECTIONS.workOrders)
    .where('status', '==', 'vendor_contacted')
    .where('vendorContactedAt', '<', Timestamp.fromDate(timeoutCutoff))
    .get();

  logger.info(`Found ${timedOutOrders.size} timed-out vendor assignments`);

  for (const woDoc of timedOutOrders.docs) {
    const workOrder = { id: woDoc.id, ...woDoc.data() } as WorkOrder;

    try {
      // Load the vendor that timed out (for logging/notification)
      let timedOutVendorName = 'Unknown vendor';
      if (workOrder.vendorId) {
        const vendorDoc = await db.collection(COLLECTIONS.vendors).doc(workOrder.vendorId).get();
        if (vendorDoc.exists) {
          timedOutVendorName = (vendorDoc.data() as Vendor).name;
        }
      }

      // Record the timeout: add current vendor to declined list, clear vendor fields
      await woDoc.ref.update({
        vendorId: FieldValue.delete(),
        vendorContactedAt: FieldValue.delete(),
        vendorDeclinedIds: FieldValue.arrayUnion(workOrder.vendorId),
        updatedAt: Timestamp.now(),
        notes: FieldValue.arrayUnion({
          id: db.collection('_').doc().id,
          authorId: 'system',
          authorName: 'System',
          body: `Vendor "${timedOutVendorName}" did not respond within ${VENDOR_TIMEOUT_HOURS} hours. Auto-escalating to next vendor.`,
          createdAt: Timestamp.now(),
        }),
      });

      // Re-read to get updated vendorDeclinedIds
      const updatedWoDoc = await woDoc.ref.get();
      const updatedWorkOrder = { id: updatedWoDoc.id, ...updatedWoDoc.data() } as WorkOrder;

      // Load organization
      const orgDoc = await db
        .collection(COLLECTIONS.organizations)
        .doc(workOrder.organizationId)
        .get();

      if (!orgDoc.exists) {
        logger.error('Organization not found during vendor timeout', {
          orgId: workOrder.organizationId,
        });
        continue;
      }
      const org = { id: orgDoc.id, ...orgDoc.data() } as Organization;

      // Try next vendor or escalate
      const dispatched = await dispatchToNextVendor(woDoc.ref, updatedWorkOrder, org);

      // Notify PM about the timeout regardless
      if (org.settings.escalationPhone) {
        await sendSms(
          org.settings.escalationPhone,
          SMS_TEMPLATES.vendorEscalationTimeout(timedOutVendorName, workOrder.title),
        );
      }

      logger.info('Vendor timeout processed', {
        workOrderId: woDoc.id,
        timedOutVendor: timedOutVendorName,
        nextVendorDispatched: dispatched,
      });
    } catch (error) {
      logger.error('Error processing vendor timeout', {
        workOrderId: woDoc.id,
        error,
      });
    }
  }
}

/**
 * Flags work orders that have been in `new` or `assigned` status for more
 * than STALE_DAYS days by adding a system note.
 */
async function flagStaleWorkOrders(): Promise<void> {
  logger.info('Checking for stale work orders');

  const staleCutoff = new Date();
  staleCutoff.setDate(staleCutoff.getDate() - STALE_DAYS);

  const staleOrders = await db
    .collection(COLLECTIONS.workOrders)
    .where('status', 'in', ['new', 'assigned'])
    .where('updatedAt', '<', Timestamp.fromDate(staleCutoff))
    .get();

  logger.info(`Found ${staleOrders.size} stale work orders`);

  for (const doc of staleOrders.docs) {
    const wo = doc.data();
    await doc.ref.update({
      notes: FieldValue.arrayUnion({
        id: db.collection('_').doc().id,
        authorId: 'system',
        authorName: 'System',
        body: `Auto-flagged: This work order has been in "${wo.status}" status for ${STALE_DAYS}+ days.`,
        createdAt: Timestamp.now(),
      }),
      updatedAt: Timestamp.now(),
    });
  }
}
