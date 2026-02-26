import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { ZodError } from 'zod';
import { logger } from '../../utils/logger';
import { COLLECTIONS, getMarketingAdminEmails } from '../../shared/constants';

function requireMarketingAdmin(email?: string): void {
  if (!email || !getMarketingAdminEmails().includes(email.toLowerCase())) {
    throw new HttpsError('permission-denied', 'Not authorized for marketing');
  }
}
import { approvePostSchema, rejectPostSchema } from '../../shared/validators';

const db = getFirestore();

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

// ─── Get Social Posts ───────────────────────────────────────────────

export const getSocialPosts = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
  requireMarketingAdmin(request.auth.token.email);

  const statusFilter = request.data?.status as string | undefined;
  const validStatuses = ['draft', 'approved', 'rejected', 'published'];
  if (statusFilter && !validStatuses.includes(statusFilter)) {
    throw new HttpsError('invalid-argument', `Invalid status: ${statusFilter}`);
  }

  let query = db.collection(COLLECTIONS.socialPosts)
    .orderBy('createdAt', 'desc')
    .limit(100);

  if (statusFilter) {
    query = db.collection(COLLECTIONS.socialPosts)
      .where('status', '==', statusFilter)
      .orderBy('createdAt', 'desc')
      .limit(100);
  }

  const snap = await query.get();
  // Strip imageBase64 from list response to keep payload small
  return snap.docs.map((doc) => {
    const data = doc.data();
    const { imageBase64, ...rest } = data;
    return { id: doc.id, ...rest, hasImage: !!imageBase64 };
  });
});

// ─── Approve Post ───────────────────────────────────────────────────

export const approvePost = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
  requireMarketingAdmin(request.auth.token.email);

  const data = parseZod(approvePostSchema, request.data);
  const postRef = db.collection(COLLECTIONS.socialPosts).doc(data.postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) throw new HttpsError('not-found', 'Post not found');

  const post = postDoc.data()!;
  if (post.status !== 'draft') {
    throw new HttpsError('failed-precondition', `Cannot approve post with status "${post.status}"`);
  }

  const updates: Record<string, unknown> = {
    status: 'approved',
    approvedBy: request.auth.uid,
    approvedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  if (data.scheduledFor) {
    updates.scheduledFor = Timestamp.fromDate(new Date(data.scheduledFor));
  }

  await postRef.update(updates);

  logger.info('Post approved', { postId: data.postId });
  return { success: true };
});

// ─── Reject Post ────────────────────────────────────────────────────

export const rejectPost = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
  requireMarketingAdmin(request.auth.token.email);

  const data = parseZod(rejectPostSchema, request.data);
  const postRef = db.collection(COLLECTIONS.socialPosts).doc(data.postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) throw new HttpsError('not-found', 'Post not found');

  await postRef.update({
    status: 'rejected',
    rejectedReason: data.reason,
    updatedAt: Timestamp.now(),
  });

  logger.info('Post rejected', { postId: data.postId, reason: data.reason });
  return { success: true };
});

// ─── Publish Approved Posts ─────────────────────────────────────────
// Note: This marks posts as 'published' (ready to copy-paste).
// Future: integrate with LinkedIn/Twitter APIs for auto-publishing.

export const publishApprovedPosts = onSchedule(
  {
    schedule: '0 8,12,17 * * 1-5',
    timeZone: 'America/New_York',
  },
  async () => {
    const now = Timestamp.now();

    const postsSnap = await db.collection(COLLECTIONS.socialPosts)
      .where('status', '==', 'approved')
      .where('scheduledFor', '<=', now)
      .get();

    if (postsSnap.empty) {
      logger.info('No approved posts ready to publish');
      return;
    }

    const batch = db.batch();
    for (const doc of postsSnap.docs) {
      batch.update(doc.ref, {
        status: 'published',
        publishedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    await batch.commit();
    logger.info('Posts marked as published', { count: postsSnap.size });
  },
);
