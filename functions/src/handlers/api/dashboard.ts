import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { toHttpsError } from '../../utils/errors';
import { sendSms } from '../../services/twilio.service';
import {
  getOrgPlanInfo,
  enforcePropertyLimit,
  enforceUnitLimit,
  enforceFeatureAccess,
  isWithinMessageLimit,
} from '../../utils/plan-enforcement';
import {
  COLLECTIONS,
  PLAN_TIERS,
  SMS_TEMPLATES,
  createOrganizationSchema,
  createPropertySchema,
  createUnitSchema,
  createTenantSchema,
  createVendorSchema,
  createKnowledgeBaseSchema,
  updateWorkOrderSchema,
  sendManualSmsSchema,
  updatePropertySchema,
  updateUnitSchema,
  updateTenantSchema,
  updateVendorSchema,
  updateKnowledgeBaseSchema,
  deleteEntitySchema,
  archiveConversationSchema,
} from '../../shared';

const Timestamp = admin.firestore.Timestamp;
const FieldValue = admin.firestore.FieldValue;

function requireAuth(request: CallableRequest): string {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }
  return request.auth.uid;
}

// ─── Create Organization ───────────────────────────────────────────────
export const createOrganization = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = createOrganizationSchema.parse(request.data);
    const ref = db.collection(COLLECTIONS.organizations).doc();
    await ref.set({
      ...input,
      ownerId: uid,
      plan: 'starter',
      settings: {
        aiEnabled: true,
        autoRespond: true,
        escalationEmail: input.escalationEmail,
        escalationPhone: input.escalationPhone || null,
        businessHours: {
          timezone: 'America/New_York',
          schedule: Object.fromEntries(
            ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((d) => [
              d, { enabled: true, start: '09:00', end: '17:00' },
            ]).concat(
              ['saturday', 'sunday'].map((d) => [d, { enabled: false, start: '09:00', end: '17:00' }]),
            ),
          ),
        },
        rentReminderDaysBefore: [7, 3, 1],
        emergencyKeywords: [],
        defaultLanguage: 'en',
      },
      propertyCount: 0,
      unitCount: 0,
      tenantCount: 0,
      monthlyMessageCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Link user to organization
    await db.collection(COLLECTIONS.users).doc(uid).set({
      organizationId: ref.id,
      role: 'owner',
      email: request.auth!.token.email || '',
      createdAt: Timestamp.now(),
    }, { merge: true });

    return { id: ref.id };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Create Property ───────────────────────────────────────────────────
export const createProperty = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = createPropertySchema.parse(request.data);
    const orgId = await getOrgId(uid);

    // Plan enforcement: check property limit
    const { org, config } = await getOrgPlanInfo(orgId);
    enforcePropertyLimit(org, config);

    const ref = db.collection(COLLECTIONS.properties).doc();
    await ref.set({
      ...input,
      organizationId: orgId,
      unitCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await db.collection(COLLECTIONS.organizations).doc(orgId).update({
      propertyCount: FieldValue.increment(1),
    });
    return { id: ref.id };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Create Unit ───────────────────────────────────────────────────────
export const createUnit = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = createUnitSchema.parse(request.data);
    const orgId = await getOrgId(uid);

    // Plan enforcement: check unit limit
    const { org, config } = await getOrgPlanInfo(orgId);
    enforceUnitLimit(org, config);

    const ref = db.collection(COLLECTIONS.units).doc();
    await ref.set({
      ...input,
      organizationId: orgId,
      status: 'vacant',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await db.collection(COLLECTIONS.properties).doc(input.propertyId).update({
      unitCount: FieldValue.increment(1),
    });
    await db.collection(COLLECTIONS.organizations).doc(orgId).update({
      unitCount: FieldValue.increment(1),
    });
    return { id: ref.id };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Create Tenant ─────────────────────────────────────────────────────
export const createTenant = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = createTenantSchema.parse(request.data);
    const orgId = await getOrgId(uid);
    const ref = db.collection(COLLECTIONS.tenants).doc();
    await ref.set({
      ...input,
      organizationId: orgId,
      balance: 0,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await db.collection(COLLECTIONS.units).doc(input.unitId).update({
      currentTenantId: ref.id,
      status: 'occupied',
    });
    await db.collection(COLLECTIONS.organizations).doc(orgId).update({
      tenantCount: FieldValue.increment(1),
    });
    return { id: ref.id };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Create Vendor ─────────────────────────────────────────────────────
export const createVendor = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = createVendorSchema.parse(request.data);
    const orgId = await getOrgId(uid);

    // Plan enforcement: Vendor Management requires Growth plan or higher
    const { plan } = await getOrgPlanInfo(orgId);
    enforceFeatureAccess(plan, 'growth');

    const ref = db.collection(COLLECTIONS.vendors).doc();
    await ref.set({
      ...input,
      organizationId: orgId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { id: ref.id };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Update Work Order ─────────────────────────────────────────────────
export const updateWorkOrder = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = updateWorkOrderSchema.parse(request.data);
    const orgId = await getOrgId(uid);
    const { workOrderId, note, ...updates } = input;

    const ref = db.collection(COLLECTIONS.workOrders).doc(workOrderId);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.organizationId !== orgId) {
      throw new HttpsError('not-found', 'Work order not found');
    }

    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (note) {
      updateData.notes = FieldValue.arrayUnion({
        id: db.collection('_').doc().id,
        authorId: uid,
        authorName: 'Property Manager',
        body: note,
        createdAt: Timestamp.now(),
      });
    }

    if (updates.status === 'completed') {
      updateData.completedDate = new Date().toISOString().split('T')[0];
    }

    await ref.update(updateData);

    // Notify tenant if status changed (skip if opted out)
    if (updates.status) {
      const woData = doc.data()!;
      const tenantDoc = await db.collection(COLLECTIONS.tenants).doc(woData.tenantId).get();
      if (tenantDoc.exists) {
        const tenant = tenantDoc.data()!;
        if (tenant.smsOptedOut === true) {
          logger.info('Skipping work order status SMS for opted-out tenant', { tenantId: woData.tenantId });
        } else {
          let smsBody = '';
          if (updates.status === 'completed') {
            smsBody = SMS_TEMPLATES.workOrderCompleted(tenant.firstName, woData.title);
          } else if (updates.status === 'assigned' && updates.vendorId) {
            const vendorDoc = await db.collection(COLLECTIONS.vendors).doc(updates.vendorId).get();
            const vendorName = vendorDoc.exists ? vendorDoc.data()!.name : 'a technician';
            smsBody = SMS_TEMPLATES.workOrderAssigned(tenant.firstName, woData.title, vendorName);
          }
          if (smsBody) {
            await sendSms(tenant.phone, smsBody);
          }
        }
      }
    }

    return { success: true };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Get Dashboard Stats ───────────────────────────────────────────────
export const getDashboardStats = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const orgId = await getOrgId(uid);
    const { plan, config, org } = await getOrgPlanInfo(orgId);

    const [activeConvs, openWorkOrders, escalated] = await Promise.all([
      db.collection(COLLECTIONS.conversations)
        .where('organizationId', '==', orgId)
        .where('status', 'in', ['active', 'escalated'])
        .count().get(),
      db.collection(COLLECTIONS.workOrders)
        .where('organizationId', '==', orgId)
        .where('status', 'in', ['new', 'vendor_contacted', 'assigned', 'scheduled', 'in_progress'])
        .count().get(),
      db.collection(COLLECTIONS.conversations)
        .where('organizationId', '==', orgId)
        .where('isEscalated', '==', true)
        .where('status', '==', 'escalated')
        .count().get(),
    ]);

    return {
      properties: org.propertyCount || 0,
      units: org.unitCount || 0,
      tenants: org.tenantCount || 0,
      activeConversations: activeConvs.data().count,
      openWorkOrders: openWorkOrders.data().count,
      escalated: escalated.data().count,
      monthlyMessages: org.monthlyMessageCount || 0,
      plan,
      planConfig: {
        name: config.name,
        price: config.price,
        maxProperties: config.maxProperties,
        maxUnits: config.maxUnits,
        maxMessages: config.maxMessages,
        features: config.features,
      },
    };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Create Knowledge Base Entry ───────────────────────────────────────
export const createKnowledgeBaseEntry = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = createKnowledgeBaseSchema.parse(request.data);
    const orgId = await getOrgId(uid);

    // Plan enforcement: Knowledge Base requires Growth plan or higher
    const { plan } = await getOrgPlanInfo(orgId);
    enforceFeatureAccess(plan, 'growth');

    const ref = db.collection(COLLECTIONS.knowledgeBase).doc();
    await ref.set({
      ...input,
      organizationId: orgId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { id: ref.id };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Send Manual SMS ───────────────────────────────────────────────────
export const sendManualSms = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = sendManualSmsSchema.parse(request.data);
    const orgId = await getOrgId(uid);

    // Plan enforcement: check message limit
    const { org, config } = await getOrgPlanInfo(orgId);
    if (!isWithinMessageLimit(org, config)) {
      throw new HttpsError(
        'resource-exhausted',
        `Monthly message limit of ${config.maxMessages} reached for your ${config.name} plan. Upgrade to send more messages.`,
      );
    }

    const convDoc = await db.collection(COLLECTIONS.conversations).doc(input.conversationId).get();
    if (!convDoc.exists || convDoc.data()?.organizationId !== orgId) {
      throw new HttpsError('not-found', 'Conversation not found');
    }
    const conv = convDoc.data()!;

    // Check if tenant has opted out of SMS (TCPA compliance)
    if (conv.tenantId) {
      const tenantDoc = await db.collection(COLLECTIONS.tenants).doc(conv.tenantId).get();
      if (tenantDoc.exists && tenantDoc.data()?.smsOptedOut === true) {
        throw new HttpsError(
          'failed-precondition',
          'Cannot send SMS to a tenant who has opted out of messages. The tenant must text START to re-subscribe.',
        );
      }
    }

    const sid = await sendSms(conv.tenantPhone, input.body);

    await db.collection(COLLECTIONS.messages).add({
      conversationId: input.conversationId,
      organizationId: orgId,
      direction: 'outbound',
      sender: 'pm',
      body: input.body,
      twilioSid: sid,
      status: 'sent',
      createdAt: Timestamp.now(),
    });

    // Increment monthly message counter
    await db.collection(COLLECTIONS.organizations).doc(orgId).update({
      monthlyMessageCount: FieldValue.increment(1),
    });

    await convDoc.ref.update({
      lastMessagePreview: input.body.substring(0, 100),
      lastMessageAt: Timestamp.now(),
      unreadCount: 0,
      updatedAt: Timestamp.now(),
    });

    return { success: true, sid };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Update Property ──────────────────────────────────────────────────
export const updateProperty = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = updatePropertySchema.parse(request.data);
    const orgId = await getOrgId(uid);
    const { propertyId, ...updates } = input;
    const ref = db.collection(COLLECTIONS.properties).doc(propertyId);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.organizationId !== orgId) {
      throw new HttpsError('not-found', 'Property not found');
    }
    await ref.update({ ...updates, updatedAt: Timestamp.now() });
    return { success: true };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Delete Property ──────────────────────────────────────────────────
export const deleteProperty = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const { id } = deleteEntitySchema.parse(request.data);
    const orgId = await getOrgId(uid);
    const ref = db.collection(COLLECTIONS.properties).doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.organizationId !== orgId) {
      throw new HttpsError('not-found', 'Property not found');
    }
    // Check for units
    const unitsSnap = await db.collection(COLLECTIONS.units).where('propertyId', '==', id).limit(1).get();
    if (!unitsSnap.empty) {
      throw new HttpsError('failed-precondition', 'Cannot delete property with existing units. Remove units first.');
    }
    await ref.delete();
    await db.collection(COLLECTIONS.organizations).doc(orgId).update({
      propertyCount: FieldValue.increment(-1),
    });
    return { success: true };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Update Unit ──────────────────────────────────────────────────────
export const updateUnit = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = updateUnitSchema.parse(request.data);
    const orgId = await getOrgId(uid);
    const { unitId, ...updates } = input;
    const ref = db.collection(COLLECTIONS.units).doc(unitId);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.organizationId !== orgId) {
      throw new HttpsError('not-found', 'Unit not found');
    }
    await ref.update({ ...updates, updatedAt: Timestamp.now() });
    return { success: true };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Delete Unit ──────────────────────────────────────────────────────
export const deleteUnit = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const { id } = deleteEntitySchema.parse(request.data);
    const orgId = await getOrgId(uid);
    const ref = db.collection(COLLECTIONS.units).doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.organizationId !== orgId) {
      throw new HttpsError('not-found', 'Unit not found');
    }
    const unitData = doc.data()!;
    if (unitData.currentTenantId) {
      throw new HttpsError('failed-precondition', 'Cannot delete unit with an active tenant.');
    }
    await ref.delete();
    await db.collection(COLLECTIONS.properties).doc(unitData.propertyId).update({
      unitCount: FieldValue.increment(-1),
    });
    await db.collection(COLLECTIONS.organizations).doc(orgId).update({
      unitCount: FieldValue.increment(-1),
    });
    return { success: true };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Update Tenant ────────────────────────────────────────────────────
export const updateTenant = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = updateTenantSchema.parse(request.data);
    const orgId = await getOrgId(uid);
    const { tenantId, ...updates } = input;
    const ref = db.collection(COLLECTIONS.tenants).doc(tenantId);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.organizationId !== orgId) {
      throw new HttpsError('not-found', 'Tenant not found');
    }
    await ref.update({ ...updates, updatedAt: Timestamp.now() });
    return { success: true };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Delete Tenant ────────────────────────────────────────────────────
export const deleteTenant = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const { id } = deleteEntitySchema.parse(request.data);
    const orgId = await getOrgId(uid);
    const ref = db.collection(COLLECTIONS.tenants).doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.organizationId !== orgId) {
      throw new HttpsError('not-found', 'Tenant not found');
    }
    const tenantData = doc.data()!;
    await ref.delete();
    // Clear unit's tenant reference
    if (tenantData.unitId) {
      await db.collection(COLLECTIONS.units).doc(tenantData.unitId).update({
        currentTenantId: FieldValue.delete(),
        status: 'vacant',
      });
    }
    await db.collection(COLLECTIONS.organizations).doc(orgId).update({
      tenantCount: FieldValue.increment(-1),
    });
    return { success: true };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Update Vendor ────────────────────────────────────────────────────
export const updateVendor = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = updateVendorSchema.parse(request.data);
    const orgId = await getOrgId(uid);
    const { vendorId, ...updates } = input;
    const ref = db.collection(COLLECTIONS.vendors).doc(vendorId);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.organizationId !== orgId) {
      throw new HttpsError('not-found', 'Vendor not found');
    }
    await ref.update({ ...updates, updatedAt: Timestamp.now() });
    return { success: true };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Delete Vendor ────────────────────────────────────────────────────
export const deleteVendor = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const { id } = deleteEntitySchema.parse(request.data);
    const orgId = await getOrgId(uid);
    const ref = db.collection(COLLECTIONS.vendors).doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.organizationId !== orgId) {
      throw new HttpsError('not-found', 'Vendor not found');
    }
    await ref.delete();
    return { success: true };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Update Knowledge Base Entry ──────────────────────────────────────
export const updateKnowledgeBaseEntry = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = updateKnowledgeBaseSchema.parse(request.data);
    const orgId = await getOrgId(uid);
    const { entryId, ...updates } = input;
    const ref = db.collection(COLLECTIONS.knowledgeBase).doc(entryId);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.organizationId !== orgId) {
      throw new HttpsError('not-found', 'Knowledge base entry not found');
    }
    await ref.update({ ...updates, updatedAt: Timestamp.now() });
    return { success: true };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Delete Knowledge Base Entry ──────────────────────────────────────
export const deleteKnowledgeBaseEntry = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const { id } = deleteEntitySchema.parse(request.data);
    const orgId = await getOrgId(uid);
    const ref = db.collection(COLLECTIONS.knowledgeBase).doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.organizationId !== orgId) {
      throw new HttpsError('not-found', 'Knowledge base entry not found');
    }
    await ref.delete();
    return { success: true };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Archive Conversation ─────────────────────────────────────────────
export const archiveConversation = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const input = archiveConversationSchema.parse(request.data);
    const orgId = await getOrgId(uid);
    const ref = db.collection(COLLECTIONS.conversations).doc(input.conversationId);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.organizationId !== orgId) {
      throw new HttpsError('not-found', 'Conversation not found');
    }
    await ref.update({
      status: input.status,
      isEscalated: false,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Helper ────────────────────────────────────────────────────────────
async function getOrgId(uid: string): Promise<string> {
  const userDoc = await db.collection(COLLECTIONS.users).doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User profile not found');
  }
  return userDoc.data()!.organizationId;
}
