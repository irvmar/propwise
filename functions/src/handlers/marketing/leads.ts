import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { ZodError } from 'zod';
import { logger } from '../../utils/logger';
import { COLLECTIONS, getMarketingAdminEmails } from '../../shared/constants';
import { addLeadSchema, importLeadsSchema } from '../../shared/validators';

function requireMarketingAdmin(email?: string): void {
  if (!email || !getMarketingAdminEmails().includes(email.toLowerCase())) {
    throw new HttpsError('permission-denied', 'Not authorized for marketing');
  }
}
import type { LeadStatus } from '../../shared/types';

const db = getFirestore();

const VALID_LEAD_STATUSES: LeadStatus[] = ['new', 'nurturing', 'hot', 'converted', 'unsubscribed', 'bounced'];

function parseZod<T>(schema: { parse: (data: unknown) => T }, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (e) {
    if (e instanceof ZodError) {
      throw new HttpsError('invalid-argument', e.errors.map((err) => err.message).join(', '));
    }
    throw e;
  }
}

// ─── Add Single Lead ────────────────────────────────────────────────

export const addLead = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
  requireMarketingAdmin(request.auth.token.email);

  const data = parseZod(addLeadSchema, request.data);

  // Deduplicate by email
  const existing = await db.collection(COLLECTIONS.leads)
    .where('email', '==', data.email)
    .limit(1)
    .get();

  if (!existing.empty) {
    throw new HttpsError('already-exists', 'Lead with this email already exists');
  }

  // Find default sequence
  const seqSnap = await db.collection(COLLECTIONS.emailSequences)
    .where('isDefault', '==', true)
    .limit(1)
    .get();

  const sequenceId = seqSnap.empty ? null : seqSnap.docs[0].id;
  const now = Timestamp.now();

  const leadRef = db.collection(COLLECTIONS.leads).doc();
  await leadRef.set({
    email: data.email,
    name: data.name,
    company: data.company ?? null,
    portfolioSize: data.portfolioSize ?? null,
    market: data.market ?? null,
    source: data.source,
    status: 'new',
    score: 0,
    sequenceId,
    sequenceStep: 0,
    nextEmailAt: now,
    lastEmailAt: null,
    createdAt: now,
    updatedAt: now,
  });

  logger.info('Lead added', { leadId: leadRef.id, email: data.email });
  return { leadId: leadRef.id };
});

// ─── Bulk Import Leads ──────────────────────────────────────────────

export const importLeads = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
  requireMarketingAdmin(request.auth.token.email);

  const { leads } = parseZod(importLeadsSchema, request.data);

  // Deduplicate against existing leads — query only the emails we're importing
  const importEmails = [...new Set(leads.map((l) => l.email))];
  const existingEmails = new Set<string>();

  // Query in batches of 30 (Firestore 'in' limit)
  for (let i = 0; i < importEmails.length; i += 30) {
    const batch = importEmails.slice(i, i + 30);
    const snap = await db.collection(COLLECTIONS.leads)
      .where('email', 'in', batch)
      .select()
      .get();
    for (const doc of snap.docs) {
      // We need the email, so fetch it from the query
      const emailSnap = await doc.ref.get();
      existingEmails.add(emailSnap.data()?.email);
    }
  }

  // Find default sequence
  const seqSnap = await db.collection(COLLECTIONS.emailSequences)
    .where('isDefault', '==', true)
    .limit(1)
    .get();
  const sequenceId = seqSnap.empty ? null : seqSnap.docs[0].id;

  const now = Timestamp.now();
  const newLeads = leads.filter((l) => !existingEmails.has(l.email));

  // Batch write in chunks of 500
  let imported = 0;
  for (let i = 0; i < newLeads.length; i += 500) {
    const chunk = newLeads.slice(i, i + 500);
    const batch = db.batch();

    for (const lead of chunk) {
      const ref = db.collection(COLLECTIONS.leads).doc();
      batch.set(ref, {
        email: lead.email,
        name: lead.name,
        company: lead.company ?? null,
        portfolioSize: lead.portfolioSize ?? null,
        market: lead.market ?? null,
        source: lead.source,
        status: 'new',
        score: 0,
        sequenceId,
        sequenceStep: 0,
        nextEmailAt: now,
        lastEmailAt: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();
    imported += chunk.length;
  }

  logger.info('Leads imported', { total: leads.length, imported, skipped: leads.length - imported });
  return { imported, skipped: leads.length - imported };
});

// ─── Get Leads ──────────────────────────────────────────────────────

export const getLeads = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
  requireMarketingAdmin(request.auth.token.email);

  const statusFilter = request.data?.status as string | undefined;

  // Validate status filter if provided
  if (statusFilter && !VALID_LEAD_STATUSES.includes(statusFilter as LeadStatus)) {
    throw new HttpsError('invalid-argument', `Invalid status filter: ${statusFilter}`);
  }

  let query = db.collection(COLLECTIONS.leads).orderBy('createdAt', 'desc').limit(200);

  if (statusFilter) {
    query = db.collection(COLLECTIONS.leads)
      .where('status', '==', statusFilter)
      .orderBy('createdAt', 'desc')
      .limit(200);
  }

  const snap = await query.get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

// ─── Get Marketing Stats ────────────────────────────────────────────

export const getMarketingStats = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
  requireMarketingAdmin(request.auth.token.email);

  // Use count aggregation queries instead of loading all documents
  const [
    totalLeadsSnap,
    newLeadsSnap,
    nurturingLeadsSnap,
    hotLeadsSnap,
    convertedLeadsSnap,
    sentEventsSnap,
    deliveredEventsSnap,
    openedEventsSnap,
    clickedEventsSnap,
    bouncedEventsSnap,
    complainedEventsSnap,
    totalPostsSnap,
    draftPostsSnap,
    approvedPostsSnap,
    publishedPostsSnap,
  ] = await Promise.all([
    db.collection(COLLECTIONS.leads).count().get(),
    db.collection(COLLECTIONS.leads).where('status', '==', 'new').count().get(),
    db.collection(COLLECTIONS.leads).where('status', '==', 'nurturing').count().get(),
    db.collection(COLLECTIONS.leads).where('status', '==', 'hot').count().get(),
    db.collection(COLLECTIONS.leads).where('status', '==', 'converted').count().get(),
    db.collection(COLLECTIONS.emailEvents).where('type', '==', 'sent').count().get(),
    db.collection(COLLECTIONS.emailEvents).where('type', '==', 'delivered').count().get(),
    db.collection(COLLECTIONS.emailEvents).where('type', '==', 'opened').count().get(),
    db.collection(COLLECTIONS.emailEvents).where('type', '==', 'clicked').count().get(),
    db.collection(COLLECTIONS.emailEvents).where('type', '==', 'bounced').count().get(),
    db.collection(COLLECTIONS.emailEvents).where('type', '==', 'complained').count().get(),
    db.collection(COLLECTIONS.socialPosts).count().get(),
    db.collection(COLLECTIONS.socialPosts).where('status', '==', 'draft').count().get(),
    db.collection(COLLECTIONS.socialPosts).where('status', '==', 'approved').count().get(),
    db.collection(COLLECTIONS.socialPosts).where('status', '==', 'published').count().get(),
  ]);

  const sent = sentEventsSnap.data().count;
  const opened = openedEventsSnap.data().count;
  const clicked = clickedEventsSnap.data().count;

  return {
    leads: {
      total: totalLeadsSnap.data().count,
      byStatus: {
        new: newLeadsSnap.data().count,
        nurturing: nurturingLeadsSnap.data().count,
        hot: hotLeadsSnap.data().count,
        converted: convertedLeadsSnap.data().count,
      },
    },
    emails: {
      sent,
      opened,
      clicked,
      openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
      byType: {
        sent,
        delivered: deliveredEventsSnap.data().count,
        opened,
        clicked,
        bounced: bouncedEventsSnap.data().count,
        complained: complainedEventsSnap.data().count,
      },
    },
    social: {
      total: totalPostsSnap.data().count,
      byStatus: {
        draft: draftPostsSnap.data().count,
        approved: approvedPostsSnap.data().count,
        published: publishedPostsSnap.data().count,
      },
    },
  };
});

// ─── Check Marketing Access ──────────────────────────────────────────

export const checkMarketingAccess = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
  const email = request.auth.token.email;
  const authorized = !!email && getMarketingAdminEmails().includes(email.toLowerCase());
  return { authorized };
});
