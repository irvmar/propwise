import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { logger } from '../../utils/logger';
import { COLLECTIONS, getMarketingAdminEmails } from '../../shared/constants';

const db = getFirestore();

// ─── Helpers ─────────────────────────────────────────────────────────

function extractTitleFromMdx(mdxContent: string): string | null {
  const match = mdxContent.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const frontmatter = match[1];
  const titleMatch = frontmatter.match(/^title:\s*['"]?(.*?)['"]?\s*$/m);
  return titleMatch ? titleMatch[1].trim() : null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function generateUniqueSlug(baseSlug: string, excludeDocId?: string): Promise<string> {
  let candidate = baseSlug;
  let suffix = 0;

  for (;;) {
    const snap = await db.collection(COLLECTIONS.blogDrafts)
      .where('slug', '==', candidate)
      .limit(2)
      .get();

    const conflicts = snap.docs.filter((d) => d.id !== excludeDocId);
    if (conflicts.length === 0) return candidate;

    suffix++;
    candidate = `${baseSlug}-${suffix}`;
  }
}

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

    // Auto-generate unique slug from MDX frontmatter title
    const title = extractTitleFromMdx(mdxContent);
    const baseSlug = title ? slugify(title) : slugify(topic);
    const slug = await generateUniqueSlug(baseSlug);

    const ref = db.collection(COLLECTIONS.blogDrafts).doc();
    const draft = {
      topic,
      targetKeywords: targetKeywords || [],
      angle: angle || null,
      wordCount: wordCount || 0,
      mdxContent,
      slug,
      status: 'draft',
      createdBy: email,
      tokensUsed: tokensUsed || 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await ref.set(draft);
    logger.info('Blog draft saved', { id: ref.id, topic, slug });

    return { id: ref.id, slug };
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

    const input = request.data as Record<string, unknown>;
    const draftId = typeof input.draftId === 'string' ? input.draftId : '';
    const status = input.status as string | undefined;
    const mdxContent = typeof input.mdxContent === 'string' ? input.mdxContent : undefined;

    if (!draftId) {
      throw new HttpsError('invalid-argument', 'draftId is required');
    }
    if (status !== undefined && status !== 'draft' && status !== 'published') {
      throw new HttpsError('invalid-argument', 'status must be "draft" or "published"');
    }

    const ref = db.collection(COLLECTIONS.blogDrafts).doc(draftId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError('not-found', 'Draft not found');
    }

    const existing = doc.data();
    if (!existing) {
      throw new HttpsError('not-found', 'Draft data missing');
    }
    const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };
    if (status) updates.status = status;
    if (mdxContent) {
      updates.mdxContent = mdxContent;
      // Regenerate slug if content changed
      const title = extractTitleFromMdx(mdxContent);
      if (title) updates.slug = await generateUniqueSlug(slugify(title), draftId);
    }

    // Set publishedAt when transitioning to published
    if (status === 'published' && existing.status !== 'published') {
      updates.publishedAt = Timestamp.now();
    }

    // Clear publishedAt when unpublishing
    if (status === 'draft' && existing.status === 'published') {
      updates.publishedAt = FieldValue.delete();
    }

    await ref.update(updates);
    logger.info('Blog draft updated', { draftId, status, slug: updates.slug });

    return { success: true, slug: updates.slug || existing.slug };
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

    const deleteInput = request.data as Record<string, unknown>;
    const draftId = typeof deleteInput.draftId === 'string' ? deleteInput.draftId : '';
    if (!draftId) {
      throw new HttpsError('invalid-argument', 'draftId is required');
    }

    const ref = db.collection(COLLECTIONS.blogDrafts).doc(draftId);
    const doc = await ref.get();
    if (doc.exists && doc.data()?.status === 'published') {
      throw new HttpsError('failed-precondition', 'Cannot delete a published post. Unpublish it first.');
    }

    await ref.delete();
    logger.info('Blog draft deleted', { draftId });

    return { success: true };
  },
);
