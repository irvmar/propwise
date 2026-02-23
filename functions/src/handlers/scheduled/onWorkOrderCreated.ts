import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { sendSms } from '../../services/twilio.service';
import { COLLECTIONS, SMS_TEMPLATES, Organization, WorkOrder } from '../../shared';
import { dispatchToNextVendor } from '../sms/VendorIncomingSms';

export const onWorkOrderCreated = onDocumentCreated(
  `${COLLECTIONS.workOrders}/{workOrderId}`,
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const workOrder = { id: snap.id, ...snap.data() } as WorkOrder;
    logger.info('Work order created', { id: snap.id, title: workOrder.title });

    // Send confirmation to tenant (skip if opted out)
    try {
      const tenantDoc = await db.collection(COLLECTIONS.tenants).doc(workOrder.tenantId).get();
      if (tenantDoc.exists) {
        const tenant = tenantDoc.data()!;
        if (tenant.smsOptedOut === true) {
          logger.info('Skipping work order confirmation for opted-out tenant', { tenantId: workOrder.tenantId });
        } else if (workOrder.source !== 'sms') {
          // Only send if the work order did NOT come from SMS (already acknowledged inline)
          await sendSms(
            tenant.phone,
            SMS_TEMPLATES.workOrderCreated(tenant.firstName, workOrder.title),
          );
        }
      }
    } catch (error) {
      logger.error('Failed to send work order confirmation', { error });
    }

    // Load organization (needed for both emergency notification and vendor dispatch)
    const orgDoc = await db.collection(COLLECTIONS.organizations).doc(workOrder.organizationId).get();
    if (!orgDoc.exists) {
      logger.error('Organization not found for work order', { orgId: workOrder.organizationId });
      return;
    }
    const org = { id: orgDoc.id, ...orgDoc.data() } as Organization;

    // Notify PM for emergency work orders
    if (workOrder.priority === 'emergency') {
      if (org.settings.escalationPhone) {
        await sendSms(
          org.settings.escalationPhone,
          `EMERGENCY WORK ORDER: ${workOrder.title}\nTenant: ${workOrder.tenantId}\nProperty: ${workOrder.propertyId}`,
        );
      }
    }

    // Dispatch to first available vendor
    try {
      const dispatched = await dispatchToNextVendor(snap.ref, workOrder, org);
      if (dispatched) {
        logger.info('Vendor dispatched for new work order', { workOrderId: snap.id });
      } else {
        logger.warn('No vendors available — work order escalated', { workOrderId: snap.id });
      }
    } catch (error) {
      logger.error('Failed to dispatch vendor for work order', { error, workOrderId: snap.id });
    }
  },
);
