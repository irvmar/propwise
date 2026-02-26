import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from '../../utils/logger';
import { COLLECTIONS, getMarketingAdminEmails } from '../../shared/constants';

const db = getFirestore();

// ─── Save a blog draft to Firestore ─────────────────────────────────

export const saveBlogDraft = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
    const email = request.auth.token.email;
    if (!email || !getMarketingAdminEmails().includes(email.toLowerCase())) {
      throw new HttpsError('permission-denied', 'Not authorized for marketing');
    }

    const { topic, targetKeywords, angle, wordCount, mdxContent, tokensUsed } = request.data as {
      topic: string;
      targetKeywords: string[];
      angle?: string;
      wordCount: number;
      mdxContent: string;
      tokensUsed: number;
    };

    if (!topic || !mdxContent) {
      throw new HttpsError('invalid-argument', 'Topic and mdxContent are required');
    }

    const ref = db.collection(COLLECTIONS.blogDrafts).doc();
    const draft = {
      topic,
      targetKeywords: targetKeywords || [],
      angle: angle || null,
      wordCount: wordCount || 0,
      mdxContent,
      status: 'draft',
      createdBy: email,
      tokensUsed: tokensUsed || 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await ref.set(draft);
    logger.info('Blog draft saved', { id: ref.id, topic });

    return { id: ref.id };
  },
);

// ─── List all blog drafts ───────────────────────────────────────────

export const getBlogDrafts = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
    const email = request.auth.token.email;
    if (!email || !getMarketingAdminEmails().includes(email.toLowerCase())) {
      throw new HttpsError('permission-denied', 'Not authorized for marketing');
    }

    const snap = await db.collection(COLLECTIONS.blogDrafts)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },
);

// ─── Update blog draft status ───────────────────────────────────────

export const updateBlogDraft = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
    const email = request.auth.token.email;
    if (!email || !getMarketingAdminEmails().includes(email.toLowerCase())) {
      throw new HttpsError('permission-denied', 'Not authorized for marketing');
    }

    const { draftId, status, mdxContent } = request.data as {
      draftId: string;
      status?: 'draft' | 'published';
      mdxContent?: string;
    };

    if (!draftId) {
      throw new HttpsError('invalid-argument', 'draftId is required');
    }

    const ref = db.collection(COLLECTIONS.blogDrafts).doc(draftId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError('not-found', 'Draft not found');
    }

    const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };
    if (status) updates.status = status;
    if (mdxContent) updates.mdxContent = mdxContent;

    await ref.update(updates);
    logger.info('Blog draft updated', { draftId, status });

    return { success: true };
  },
);

// ─── Delete blog draft ──────────────────────────────────────────────

export const deleteBlogDraft = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
    const email = request.auth.token.email;
    if (!email || !getMarketingAdminEmails().includes(email.toLowerCase())) {
      throw new HttpsError('permission-denied', 'Not authorized for marketing');
    }

    const { draftId } = request.data as { draftId: string };
    if (!draftId) {
      throw new HttpsError('invalid-argument', 'draftId is required');
    }

    await db.collection(COLLECTIONS.blogDrafts).doc(draftId).delete();
    logger.info('Blog draft deleted', { draftId });

    return { success: true };
  },
);
