import * as admin from 'firebase-admin';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { sendSms } from '../../services/twilio.service';
import { COLLECTIONS, SMS_TEMPLATES, Vendor, Organization, WorkOrder, Property } from '../../shared';

const Timestamp = admin.firestore.Timestamp;
const FieldValue = admin.firestore.FieldValue;

/**
 * Finds the next available vendor for a work order's category within the same
 * organization, excluding any vendors that have already declined.
 *
 * Vendors are sorted: preferred first, then by creation date (oldest first).
 * Returns null if no vendors are available.
 */
export async function findNextVendor(
  organizationId: string,
  category: string,
  declinedIds: string[],
): Promise<(Vendor & { id: string }) | null> {
  const vendorSnap = await db
    .collection(COLLECTIONS.vendors)
    .where('organizationId', '==', organizationId)
    .where('specialties', 'array-contains', category)
    .orderBy('isPreferred', 'desc')
    .orderBy('createdAt', 'asc')
    .get();

  for (const doc of vendorSnap.docs) {
    if (!declinedIds.includes(doc.id)) {
      return { id: doc.id, ...doc.data() } as Vendor & { id: string };
    }
  }
  return null;
}

/**
 * Builds a formatted address string from a Property document.
 */
function formatAddress(property: Property): string {
  const addr = property.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`;
}

/**
 * Dispatches a work order to the next available vendor. If no vendor is
 * available, escalates to the property manager.
 *
 * Used in three places:
 * 1. onWorkOrderCreated — initial vendor dispatch
 * 2. VendorIncomingSms — when a vendor declines
 * 3. followUpWorkOrders — when a vendor times out (2-hour window)
 *
 * Returns true if a vendor was dispatched, false if escalated.
 */
export async function dispatchToNextVendor(
  workOrderRef: FirebaseFirestore.DocumentReference,
  workOrder: WorkOrder,
  org: Organization,
): Promise<boolean> {
  const declinedIds = workOrder.vendorDeclinedIds || [];

  const nextVendor = await findNextVendor(
    workOrder.organizationId,
    workOrder.category,
    declinedIds,
  );

  if (!nextVendor) {
    // No more vendors available — escalate to PM
    await workOrderRef.update({
      status: 'escalated',
      vendorId: FieldValue.delete(),
      vendorContactedAt: FieldValue.delete(),
      updatedAt: Timestamp.now(),
      notes: FieldValue.arrayUnion({
        id: db.collection('_').doc().id,
        authorId: 'system',
        authorName: 'System',
        body: `Auto-escalated: No vendors available for category "${workOrder.category}".`,
        createdAt: Timestamp.now(),
      }),
    });

    if (org.settings.escalationPhone) {
      await sendSms(
        org.settings.escalationPhone,
        SMS_TEMPLATES.vendorDeclinedPmNotify('(all contacted)', workOrder.title, workOrder.category),
      );
    }

    logger.info('Work order escalated — no vendors available', {
      workOrderId: workOrderRef.id,
      category: workOrder.category,
    });

    return false;
  }

  // Fetch property for address
  const propertyDoc = await db.collection(COLLECTIONS.properties).doc(workOrder.propertyId).get();
  const property = propertyDoc.exists ? (propertyDoc.data() as Property) : null;
  const address = property ? formatAddress(property) : 'N/A';

  // Fetch unit for unit number
  const unitDoc = await db.collection(COLLECTIONS.units).doc(workOrder.unitId).get();
  const unitNumber = unitDoc.exists ? (unitDoc.data() as any).number : 'N/A';

  // Send dispatch SMS to vendor
  await sendSms(
    nextVendor.phone,
    SMS_TEMPLATES.vendorDispatch(
      org.name,
      workOrder.title,
      address,
      unitNumber,
      workOrder.priority,
      workOrder.description,
    ),
  );

  // Update work order with new vendor assignment
  await workOrderRef.update({
    status: 'vendor_contacted',
    vendorId: nextVendor.id,
    vendorContactedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  logger.info('Vendor dispatched for work order', {
    workOrderId: workOrderRef.id,
    vendorId: nextVendor.id,
    vendorName: nextVendor.name,
  });

  return true;
}

/**
 * Handles an inbound SMS from a vendor phone number.
 *
 * Looks up the vendor's most recent open work order (status: vendor_contacted),
 * then processes the response:
 * - YES / ACCEPT / CONFIRM  → assign the work order, notify tenant
 * - NO / DECLINE / BUSY     → decline, try next vendor or escalate
 * - Anything else            → store as a note on the work order
 */
export async function handleVendorSms(
  fromPhone: string,
  body: string,
  vendor: Vendor & { id: string },
): Promise<void> {
  const normalizedBody = body.trim().toUpperCase();

  // Find the most recent work order assigned to this vendor that is awaiting response or scheduling
  const woSnap = await db
    .collection(COLLECTIONS.workOrders)
    .where('vendorId', '==', vendor.id)
    .where('status', 'in', ['vendor_contacted', 'assigned'])
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get();

  if (woSnap.empty) {
    logger.warn('Vendor SMS received but no open work order found', {
      vendorId: vendor.id,
      phone: fromPhone,
    });
    await sendSms(
      fromPhone,
      'We could not find an open work order for your response. Please contact the property manager directly.',
    );
    return;
  }

  const woDoc = woSnap.docs[0];
  const workOrder = { id: woDoc.id, ...woDoc.data() } as WorkOrder;

  // Load organization
  const orgDoc = await db.collection(COLLECTIONS.organizations).doc(workOrder.organizationId).get();
  if (!orgDoc.exists) {
    logger.error('Organization not found for work order', { orgId: workOrder.organizationId });
    await sendSms(fromPhone, 'Sorry, we encountered a system error. Please contact the property manager directly.');
    return;
  }
  const org = { id: orgDoc.id, ...orgDoc.data() } as Organization;

  // ── YES / ACCEPT / CONFIRM ────────────────────────────────────────────
  if (['YES', 'ACCEPT', 'CONFIRM'].includes(normalizedBody)) {
    await woDoc.ref.update({
      status: 'assigned',
      updatedAt: Timestamp.now(),
      notes: FieldValue.arrayUnion({
        id: db.collection('_').doc().id,
        authorId: vendor.id,
        authorName: vendor.name,
        body: `Vendor accepted the work order via SMS.`,
        createdAt: Timestamp.now(),
      }),
    });

    // Notify the tenant
    const tenantDoc = await db.collection(COLLECTIONS.tenants).doc(workOrder.tenantId).get();
    if (tenantDoc.exists) {
      const tenant = tenantDoc.data()!;
      await sendSms(
        tenant.phone,
        SMS_TEMPLATES.vendorAcceptedTenantNotify(tenant.firstName, vendor.name, workOrder.title),
      );
    }

    // Notify PM for emergency work orders
    if (workOrder.priority === 'emergency' && org.settings.escalationPhone) {
      await sendSms(
        org.settings.escalationPhone,
        `EMERGENCY work order "${workOrder.title}" accepted by ${vendor.name}. Vendor phone: ${vendor.phone}`,
      );
    }

    // Prompt vendor for scheduling
    await sendSms(
      fromPhone,
      SMS_TEMPLATES.vendorSchedulePrompt(workOrder.title),
    );

    logger.info('Vendor accepted work order — scheduling prompted', {
      workOrderId: woDoc.id,
      vendorId: vendor.id,
    });
    return;
  }

  // ── NO / DECLINE / BUSY ───────────────────────────────────────────────
  if (['NO', 'DECLINE', 'BUSY'].includes(normalizedBody)) {
    // Record the decline
    await woDoc.ref.update({
      vendorId: FieldValue.delete(),
      vendorContactedAt: FieldValue.delete(),
      vendorDeclinedIds: FieldValue.arrayUnion(vendor.id),
      updatedAt: Timestamp.now(),
      notes: FieldValue.arrayUnion({
        id: db.collection('_').doc().id,
        authorId: vendor.id,
        authorName: vendor.name,
        body: `Vendor declined the work order via SMS.`,
        createdAt: Timestamp.now(),
      }),
    });

    // Confirm to vendor
    await sendSms(fromPhone, `Understood. You've declined the work order: "${workOrder.title}".`);

    // Re-read the work order to get updated vendorDeclinedIds
    const updatedWoDoc = await woDoc.ref.get();
    const updatedWorkOrder = { id: updatedWoDoc.id, ...updatedWoDoc.data() } as WorkOrder;

    // Try next vendor
    const dispatched = await dispatchToNextVendor(woDoc.ref, updatedWorkOrder, org);

    if (!dispatched) {
      logger.info('No more vendors available after decline', {
        workOrderId: woDoc.id,
        declinedBy: vendor.id,
      });
    }

    return;
  }

  // ── Scheduling proposal (vendor accepted, now proposing a time) ──────
  if (workOrder.status === 'assigned') {
    // Treat any freetext on an assigned WO as a scheduling proposal
    const scheduledDate = body.trim();

    await woDoc.ref.update({
      status: 'scheduled',
      scheduledDate,
      updatedAt: Timestamp.now(),
      notes: FieldValue.arrayUnion({
        id: db.collection('_').doc().id,
        authorId: vendor.id,
        authorName: vendor.name,
        body: `Vendor proposed schedule: ${scheduledDate}`,
        createdAt: Timestamp.now(),
      }),
    });

    // Confirm to vendor
    await sendSms(
      fromPhone,
      SMS_TEMPLATES.vendorScheduleConfirm(workOrder.title, scheduledDate),
    );

    // Notify tenant
    const tenantDoc = await db.collection(COLLECTIONS.tenants).doc(workOrder.tenantId).get();
    if (tenantDoc.exists) {
      const tenant = tenantDoc.data()!;
      if (!tenant.smsOptedOut) {
        await sendSms(
          tenant.phone,
          SMS_TEMPLATES.tenantScheduleNotify(
            tenant.firstName,
            workOrder.title,
            vendor.name,
            scheduledDate,
          ),
        );
      }
    }

    logger.info('Work order scheduled by vendor', {
      workOrderId: woDoc.id,
      vendorId: vendor.id,
      scheduledDate,
    });
    return;
  }

  // ── Freetext / anything else → store as note ──────────────────────────
  await woDoc.ref.update({
    updatedAt: Timestamp.now(),
    notes: FieldValue.arrayUnion({
      id: db.collection('_').doc().id,
      authorId: vendor.id,
      authorName: vendor.name,
      body: `Vendor SMS: ${body}`,
      createdAt: Timestamp.now(),
    }),
  });

  await sendSms(
    fromPhone,
    `Your message has been noted on work order: "${workOrder.title}". Reply YES to accept or NO to decline.`,
  );

  logger.info('Vendor freetext stored as note', {
    workOrderId: woDoc.id,
    vendorId: vendor.id,
  });
}
