import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { requireTwilioSignature } from '../../middleware/twilio.middleware';
import { processMessage, AgentContext } from '../../agents';
import { sendSms } from '../../services/twilio.service';
import { getOrgPlanInfo, isWithinMessageLimit } from '../../utils/plan-enforcement';
import {
  COLLECTIONS,
  SMS_TEMPLATES,
  SMS_OPT_OUT_KEYWORDS,
  SMS_OPT_IN_KEYWORDS,
  Tenant,
  Vendor,
  Organization,
  Conversation,
  Message,
  KnowledgeBase,
  Unit,
} from '../../shared';
import { handleVendorSms } from './VendorIncomingSms';

const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

/**
 * Regex to parse a name + unit reply from an unknown sender.
 * Accepts formats like:
 *   "John Smith, Unit 4B"
 *   "John Smith Unit 4B"
 *   "John Smith, Apt 4B"
 *   "John Smith, #4B"
 *   "John Smith 4B"
 */
const NAME_UNIT_REGEX =
  /^([A-Za-z'-]+)\s+([A-Za-z'-]+(?:\s+[A-Za-z'-]+)*?)[,\s]+(?:unit|apt|apartment|suite|#)?\s*([A-Za-z0-9-]+)$/i;

export const incomingSms = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  if (!requireTwilioSignature(req, res)) return;

  const { From: fromPhone, Body: body, MessageSid: twilioSid } = req.body;

  logger.info('Incoming SMS', { from: fromPhone, bodyLength: body?.length });

  try {
    const normalizedBody = (body || '').trim().toLowerCase();

    // ─── STOP / Opt-Out Handling (TCPA Compliance) ──────────────────────
    if (SMS_OPT_OUT_KEYWORDS.includes(normalizedBody)) {
      logger.info('Opt-out keyword received', { phone: fromPhone, keyword: normalizedBody });

      // Look up tenant to update their record
      const optOutSnap = await db
        .collection(COLLECTIONS.tenants)
        .where('phone', '==', fromPhone)
        .limit(1)
        .get();

      if (!optOutSnap.empty) {
        await optOutSnap.docs[0].ref.update({
          smsOptedOut: true,
          smsOptOutDate: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        logger.info('Tenant opted out of SMS', { tenantId: optOutSnap.docs[0].id });
      }

      // Always send confirmation even if no tenant found (carrier compliance)
      await sendSms(fromPhone, SMS_TEMPLATES.optOutConfirmation());
      res.type('text/xml').send('<Response></Response>');
      return;
    }

    // ─── START / Opt-In Handling ────────────────────────────────────────
    if (SMS_OPT_IN_KEYWORDS.includes(normalizedBody)) {
      logger.info('Opt-in keyword received', { phone: fromPhone, keyword: normalizedBody });

      const optInSnap = await db
        .collection(COLLECTIONS.tenants)
        .where('phone', '==', fromPhone)
        .limit(1)
        .get();

      if (!optInSnap.empty) {
        await optInSnap.docs[0].ref.update({
          smsOptedOut: false,
          updatedAt: Timestamp.now(),
        });
        logger.info('Tenant opted back in to SMS', { tenantId: optInSnap.docs[0].id });
      }

      await sendSms(fromPhone, SMS_TEMPLATES.optInConfirmation());
      res.type('text/xml').send('<Response></Response>');
      return;
    }

    // ─── 0. Check if sender is a vendor ─────────────────────────────────
    const vendorSnap = await db
      .collection(COLLECTIONS.vendors)
      .where('phone', '==', fromPhone)
      .limit(1)
      .get();

    if (!vendorSnap.empty) {
      const vendorDoc = vendorSnap.docs[0];
      const vendor = { id: vendorDoc.id, ...vendorDoc.data() } as Vendor & { id: string };
      logger.info('Incoming SMS from vendor', { vendorId: vendor.id, name: vendor.name });
      await handleVendorSms(fromPhone, body, vendor);
      res.type('text/xml').send('<Response></Response>');
      return;
    }

    // ─── 1. Find tenant by phone number ─────────────────────────────────
    const tenantSnap = await db
      .collection(COLLECTIONS.tenants)
      .where('phone', '==', fromPhone)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    // ─── Unknown Tenant Fallback ────────────────────────────────────────
    if (tenantSnap.empty) {
      logger.warn('Unknown sender', { phone: fromPhone });
      await handleUnknownSender(fromPhone, body);
      res.type('text/xml').send('<Response></Response>');
      return;
    }

    const tenantDoc = tenantSnap.docs[0];
    const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;

    // ─── Opt-out guard: do not process messages from opted-out tenants ──
    if (tenant.smsOptedOut === true) {
      logger.info('Ignoring message from opted-out tenant', { tenantId: tenant.id });
      res.type('text/xml').send('<Response></Response>');
      return;
    }

    // 2. Get organization
    const orgDoc = await db.collection(COLLECTIONS.organizations).doc(tenant.organizationId).get();
    if (!orgDoc.exists) {
      logger.error('Organization not found', { orgId: tenant.organizationId });
      res.type('text/xml').send('<Response></Response>');
      return;
    }
    const organization = { id: orgDoc.id, ...orgDoc.data() } as Organization;

    // 3. Check if AI is enabled
    if (!organization.settings.aiEnabled) {
      logger.info('AI disabled for org', { orgId: organization.id });
      res.type('text/xml').send('<Response></Response>');
      return;
    }

    // 3.5 Plan enforcement: check monthly message limit
    const { config: planConfig } = await getOrgPlanInfo(organization.id);
    if (!isWithinMessageLimit(organization, planConfig)) {
      logger.warn('Monthly message limit reached', {
        orgId: organization.id,
        plan: organization.plan,
        count: organization.monthlyMessageCount,
        limit: planConfig.maxMessages,
      });
      await sendSms(
        fromPhone,
        'Your property manager\'s messaging system has reached its monthly limit. Please contact them directly for assistance.',
      );
      res.type('text/xml').send('<Response></Response>');
      return;
    }

    // 4. Get or create conversation
    let conversationRef: FirebaseFirestore.DocumentReference;
    const convSnap = await db
      .collection(COLLECTIONS.conversations)
      .where('tenantId', '==', tenant.id)
      .where('status', 'in', ['active', 'escalated'])
      .orderBy('lastMessageAt', 'desc')
      .limit(1)
      .get();

    if (convSnap.empty) {
      // Get unit number for display
      const unitDoc = await db.collection(COLLECTIONS.units).doc(tenant.unitId).get();
      const unitNumber = unitDoc.exists ? (unitDoc.data() as any).number : 'N/A';

      conversationRef = db.collection(COLLECTIONS.conversations).doc();
      const newConversation: Omit<Conversation, 'id'> = {
        organizationId: tenant.organizationId,
        tenantId: tenant.id,
        tenantPhone: tenant.phone,
        tenantName: `${tenant.firstName} ${tenant.lastName}`,
        propertyId: tenant.propertyId,
        unitNumber,
        status: 'active',
        lastMessageAt: Timestamp.now() as any,
        lastMessagePreview: body.substring(0, 100),
        unreadCount: 1,
        isEscalated: false,
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any,
      };
      await conversationRef.set(newConversation);
    } else {
      conversationRef = convSnap.docs[0].ref;
      await conversationRef.update({
        lastMessageAt: Timestamp.now(),
        lastMessagePreview: body.substring(0, 100),
        unreadCount: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      });
    }

    // 5. Save inbound message
    const inboundMessage: Omit<Message, 'id'> = {
      conversationId: conversationRef.id,
      organizationId: tenant.organizationId,
      direction: 'inbound',
      sender: 'tenant',
      body,
      twilioSid,
      status: 'received',
      createdAt: Timestamp.now() as any,
    };
    await db.collection(COLLECTIONS.messages).add(inboundMessage);

    // 6. Load conversation history
    const historySnap = await db
      .collection(COLLECTIONS.messages)
      .where('conversationId', '==', conversationRef.id)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const conversationHistory = historySnap.docs
      .reverse()
      .map((doc) => {
        const msg = doc.data() as Message;
        return {
          role: (msg.direction === 'inbound' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: msg.body,
        };
      });

    // 7. Load knowledge base
    const kbSnap = await db
      .collection(COLLECTIONS.knowledgeBase)
      .where('organizationId', '==', organization.id)
      .where('isActive', '==', true)
      .get();
    const knowledgeBase = kbSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as KnowledgeBase[];

    // 8. Process through AI agent pipeline
    const agentContext: AgentContext = {
      tenant,
      organization,
      knowledgeBase,
      conversationHistory,
    };

    const agentResponse = await processMessage(body, agentContext);

    // 9. Send response SMS
    const responseSid = await sendSms(fromPhone, agentResponse.message);

    // 10. Save outbound message
    const outboundMessage: Omit<Message, 'id'> = {
      conversationId: conversationRef.id,
      organizationId: tenant.organizationId,
      direction: 'outbound',
      sender: 'ai',
      body: agentResponse.message,
      twilioSid: responseSid,
      status: 'sent',
      intent: agentResponse.intent,
      confidence: agentResponse.confidence,
      agentType: agentResponse.intent,
      createdAt: Timestamp.now() as any,
    };
    await db.collection(COLLECTIONS.messages).add(outboundMessage);

    // 10.5 Increment monthly message counter
    await db.collection(COLLECTIONS.organizations).doc(organization.id).update({
      monthlyMessageCount: FieldValue.increment(1),
    });

    // 11. Create work order if maintenance agent produced one
    if (agentResponse.workOrderData) {
      await db.collection(COLLECTIONS.workOrders).add({
        organizationId: tenant.organizationId,
        propertyId: tenant.propertyId,
        unitId: tenant.unitId,
        tenantId: tenant.id,
        conversationId: conversationRef.id,
        title: agentResponse.workOrderData.title,
        description: agentResponse.workOrderData.description,
        category: agentResponse.workOrderData.category,
        priority: agentResponse.workOrderData.priority,
        status: 'new',
        source: 'sms',
        notes: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    // 12. Update conversation if escalated
    if (agentResponse.shouldEscalate) {
      await conversationRef.update({
        status: 'escalated',
        isEscalated: true,
        updatedAt: Timestamp.now(),
      });
    }

    // Update last message preview with response
    await conversationRef.update({
      lastMessagePreview: agentResponse.message.substring(0, 100),
      updatedAt: Timestamp.now(),
    });

    logger.info('SMS processed successfully', {
      conversationId: conversationRef.id,
      intent: agentResponse.intent,
    });

    res.type('text/xml').send('<Response></Response>');
  } catch (error) {
    logger.error('Error processing incoming SMS', { error });
    // Try to send a fallback message
    try {
      await sendSms(
        fromPhone,
        "We're having trouble processing your message. Please try again or call the office.",
      );
    } catch {
      // If even fallback fails, just log
    }
    res.type('text/xml').send('<Response></Response>');
  }
});

// ─── Unknown Sender Handler ───────────────────────────────────────────────────

async function handleUnknownSender(phone: string, body: string): Promise<void> {
  // Check if this sender has previously messaged (i.e., they might be replying with name+unit)
  const previousMessages = await db
    .collection(COLLECTIONS.unknownMessages)
    .where('phone', '==', phone)
    .where('status', '==', 'pending')
    .orderBy('receivedAt', 'desc')
    .limit(5)
    .get();

  const hasHistory = !previousMessages.empty;

  // Try to parse name + unit info from the message
  const match = NAME_UNIT_REGEX.exec(body.trim());

  if (match && hasHistory) {
    // They replied with name + unit info — attempt to match a tenant
    const [, firstName, lastName, unitNumber] = match;
    logger.info('Attempting to match unknown sender', { firstName, lastName, unitNumber, phone });

    // Store this message before attempting match
    await db.collection(COLLECTIONS.unknownMessages).add({
      phone,
      body,
      receivedAt: Timestamp.now(),
      status: 'pending',
    });

    await tryMatchTenant(phone, body, firstName.trim(), lastName.trim(), unitNumber.trim());
    return;
  }

  // Store the incoming message for PM review
  await db.collection(COLLECTIONS.unknownMessages).add({
    phone,
    body,
    receivedAt: Timestamp.now(),
    status: 'pending',
  });

  if (!hasHistory) {
    // First message from this number — send the greeting
    await sendSms(phone, SMS_TEMPLATES.unknownTenantGreeting());
  } else {
    // They have history but their reply didn't parse as name+unit — prompt them again
    await sendSms(
      phone,
      "I didn't quite catch that. Please reply with your full name and unit number (e.g., 'John Smith, Unit 4B').",
    );
  }
}

async function tryMatchTenant(
  phone: string,
  body: string,
  firstName: string,
  lastName: string,
  unitNumber: string,
): Promise<void> {
  // Search for a matching unit across all properties
  const unitSnap = await db
    .collection(COLLECTIONS.units)
    .where('number', '==', unitNumber)
    .where('status', '==', 'occupied')
    .get();

  if (unitSnap.empty) {
    // Try case-insensitive by also checking uppercase variant
    const unitSnapUpper = await db
      .collection(COLLECTIONS.units)
      .where('number', '==', unitNumber.toUpperCase())
      .where('status', '==', 'occupied')
      .get();

    if (unitSnapUpper.empty) {
      await handleNoMatch(phone, body);
      return;
    }

    // Use the uppercase match
    await matchTenantInUnits(phone, body, firstName, lastName, unitSnapUpper);
    return;
  }

  await matchTenantInUnits(phone, body, firstName, lastName, unitSnap);
}

async function matchTenantInUnits(
  phone: string,
  body: string,
  firstName: string,
  lastName: string,
  unitSnap: FirebaseFirestore.QuerySnapshot,
): Promise<void> {
  // Look for a tenant in one of the matching units whose name is close
  for (const unitDoc of unitSnap.docs) {
    const unit = { id: unitDoc.id, ...unitDoc.data() } as Unit;

    if (!unit.currentTenantId) continue;

    const tenantDoc = await db.collection(COLLECTIONS.tenants).doc(unit.currentTenantId).get();
    if (!tenantDoc.exists) continue;

    const tenant = tenantDoc.data()!;

    // Compare names (case-insensitive)
    const nameMatches =
      tenant.firstName.toLowerCase() === firstName.toLowerCase() &&
      tenant.lastName.toLowerCase() === lastName.toLowerCase();

    if (nameMatches) {
      // Match found — update the tenant's phone number
      await tenantDoc.ref.update({
        phone,
        updatedAt: Timestamp.now(),
      });

      // Mark all pending unknown messages from this phone as resolved
      const pendingSnap = await db
        .collection(COLLECTIONS.unknownMessages)
        .where('phone', '==', phone)
        .where('status', '==', 'pending')
        .get();
      const batch = db.batch();
      for (const doc of pendingSnap.docs) {
        batch.update(doc.ref, { status: 'resolved' });
      }
      await batch.commit();

      logger.info('Unknown sender matched to tenant', {
        tenantId: tenantDoc.id,
        phone,
        unitNumber: unit.number,
      });

      await sendSms(
        phone,
        `Great, ${tenant.firstName}! I've linked your phone number to your account for Unit ${unit.number}. You can now text this number anytime for maintenance requests, lease questions, or other needs.`,
      );
      return;
    }
  }

  // No name match found in any of the matching units
  await handleNoMatch(phone, body);
}

async function handleNoMatch(phone: string, body: string): Promise<void> {
  // Update the latest pending message to escalation status
  const pendingSnap = await db
    .collection(COLLECTIONS.unknownMessages)
    .where('phone', '==', phone)
    .where('status', '==', 'pending')
    .orderBy('receivedAt', 'desc')
    .limit(1)
    .get();

  if (!pendingSnap.empty) {
    await pendingSnap.docs[0].ref.update({ status: 'escalation' });
  } else {
    // Store as escalation directly
    await db.collection(COLLECTIONS.unknownMessages).add({
      phone,
      body,
      receivedAt: Timestamp.now(),
      status: 'escalation',
    });
  }

  logger.info('Unknown sender escalated — no tenant match', { phone });
  await sendSms(phone, SMS_TEMPLATES.unknownTenantNoMatch());
}
