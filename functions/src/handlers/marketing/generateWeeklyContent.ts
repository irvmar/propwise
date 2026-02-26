import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from '../../utils/logger';
import { COLLECTIONS, getMarketingAdminEmails } from '../../shared/constants';
import { generateStructured } from '../../services/claude.service';
import { generatePostImage } from '../../services/imagen.service';
import type { ContentTheme, SocialPlatform } from '../../shared/types';

const db = getFirestore();

interface ContentSlot {
  dayOfWeek: string;
  dayOffset: number;
  category: string;
  platforms: SocialPlatform[];
}

const WEEKLY_CALENDAR: ContentSlot[] = [
  { dayOfWeek: 'Monday', dayOffset: 1, category: 'Industry Insights', platforms: ['linkedin', 'twitter'] },
  { dayOfWeek: 'Tuesday', dayOffset: 2, category: 'Product Education', platforms: ['twitter'] },
  { dayOfWeek: 'Wednesday', dayOffset: 3, category: 'Customer Stories', platforms: ['linkedin', 'twitter'] },
  { dayOfWeek: 'Thursday', dayOffset: 4, category: 'Community Engagement', platforms: ['twitter'] },
  { dayOfWeek: 'Friday', dayOffset: 5, category: 'Thought Leadership', platforms: ['linkedin', 'twitter'] },
];

function getMonthlyTheme(): ContentTheme {
  // Use a fixed timezone offset for consistency (ET = UTC-5)
  const now = new Date();
  const etDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const weekOfMonth = Math.ceil(etDate.getDate() / 7);
  const themes: ContentTheme[] = ['pain_points', 'solutions', 'social_proof', 'vision'];
  return themes[(weekOfMonth - 1) % themes.length];
}

function getCampaignWeek(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ─── Upload image to Firebase Storage ────────────────────────────────

async function uploadImageToStorage(base64Data: string, path: string): Promise<string> {
  const bucket = getStorage().bucket();
  const file = bucket.file(path);
  const buffer = Buffer.from(base64Data, 'base64');
  await file.save(buffer, { contentType: 'image/png', public: true });
  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}

// ─── Core generation logic (shared between schedule and manual trigger) ─────

async function runWeeklyContentGeneration(): Promise<{ postCount: number; campaignWeek: string; skipped?: boolean }> {
  const theme = getMonthlyTheme();
  const campaignWeek = getCampaignWeek();

  // Deduplicate: skip if non-rejected posts already exist for this campaign week
  const existingSnap = await db.collection(COLLECTIONS.socialPosts)
    .where('campaignWeek', '==', campaignWeek)
    .where('status', 'in', ['draft', 'approved', 'published'])
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    logger.info('Content already exists for campaign week, skipping', { campaignWeek });
    return { postCount: 0, campaignWeek, skipped: true };
  }

  // Check auto-approve setting
  const settingsDoc = await db.collection(COLLECTIONS.marketingSettings).doc('global').get();
  const autoApprove = settingsDoc.exists && settingsDoc.data()?.autoApprove === true;

  logger.info('Generating weekly content', { theme, campaignWeek, autoApprove });

  // Fetch last 20 published posts to avoid repeating angles
  const recentSnap = await db.collection(COLLECTIONS.socialPosts)
    .where('status', '==', 'published')
    .orderBy('publishedAt', 'desc')
    .limit(20)
    .get();

  const recentAngles = recentSnap.docs.map((d) => d.data().content.substring(0, 100));

  // Get next Monday's date
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
  monday.setHours(0, 0, 0, 0);

  const batch = db.batch();
  let postCount = 0;

  for (const slot of WEEKLY_CALENDAR) {
    for (const platform of slot.platforms) {
      try {
        const { content, hashtags } = await generatePost(
          platform,
          slot.category,
          theme,
          recentAngles,
        );

        // Generate image and upload to Storage
        let imageUrl: string | null = null;
        try {
          const imagePrompt = buildImagePrompt(content, platform, slot.category);
          const imageBase64 = await generatePostImage(imagePrompt, platform);
          if (imageBase64) {
            const storagePath = `marketing/social-posts/${campaignWeek}/${platform}_${slot.dayOfWeek}.png`;
            imageUrl = await uploadImageToStorage(imageBase64, storagePath);
          }
        } catch (imgErr) {
          logger.warn('Image generation/upload failed, continuing without image', {
            platform,
            dayOfWeek: slot.dayOfWeek,
            error: imgErr instanceof Error ? imgErr.message : 'Unknown',
          });
        }

        const scheduledDate = new Date(monday);
        scheduledDate.setDate(monday.getDate() + slot.dayOffset - 1);
        scheduledDate.setHours(platform === 'linkedin' ? 8 : 12, 0, 0, 0);

        const ref = db.collection(COLLECTIONS.socialPosts).doc();
        const postData: Record<string, unknown> = {
          platform,
          content,
          hashtags,
          theme,
          dayOfWeek: slot.dayOfWeek,
          campaignWeek,
          status: autoApprove ? 'approved' : 'draft',
          imageUrl: imageUrl ?? null,
          scheduledFor: Timestamp.fromDate(scheduledDate),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        if (autoApprove) {
          postData.approvedBy = 'system';
          postData.approvedAt = Timestamp.now();
        }

        batch.set(ref, postData);

        postCount++;
      } catch (error) {
        logger.error('Error generating post', {
          platform,
          dayOfWeek: slot.dayOfWeek,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  await batch.commit();
  logger.info('Weekly content generated', { postCount, campaignWeek });
  return { postCount, campaignWeek, skipped: false };
}

// ─── Scheduled trigger (Sunday 8 PM ET) ─────────────────────────────

export const generateWeeklyContent = onSchedule(
  {
    schedule: '0 20 * * 0',
    timeZone: 'America/New_York',
    timeoutSeconds: 540,
    memory: '1GiB',
  },
  async () => {
    await runWeeklyContentGeneration();
  },
);

// ─── Manual trigger (callable from dashboard) ───────────────────────

export const triggerWeeklyContent = onCall(
  { timeoutSeconds: 540, memory: '1GiB' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
    const email = request.auth.token.email;
    if (!email || !getMarketingAdminEmails().includes(email.toLowerCase())) {
      throw new HttpsError('permission-denied', 'Not authorized for marketing');
    }

    const result = await runWeeklyContentGeneration();
    return result;
  },
);

// ─── Image prompt builder ───────────────────────────────────────────

function buildImagePrompt(postContent: string, platform: SocialPlatform, category: string): string {
  const snippet = postContent.substring(0, 150);
  return `Professional, modern social media graphic for a property management technology company. Category: ${category}. Style: clean, minimalist, corporate blue and white color scheme. No text overlay. Topic context: "${snippet}". Photorealistic with subtle tech elements.`;
}

// ─── Post text generator ────────────────────────────────────────────

const socialPostSchema = {
  name: 'create_social_post',
  description: 'Create a social media post with content and hashtags',
  input_schema: {
    type: 'object' as const,
    properties: {
      content: { type: 'string', description: 'The full post text' },
      hashtags: { type: 'array', items: { type: 'string' }, description: 'Hashtags for the post' },
    },
    required: ['content', 'hashtags'],
  },
};

async function generatePost(
  platform: SocialPlatform,
  category: string,
  theme: ContentTheme,
  recentAngles: string[],
): Promise<{ content: string; hashtags: string[] }> {
  const themeLabels: Record<ContentTheme, string> = {
    pain_points: 'Pain Points & Challenges PMs face daily',
    solutions: 'Solutions & How PropWise solves real problems',
    social_proof: 'Social Proof & Customer success stories',
    vision: 'Vision & Future of property management',
  };

  const platformConstraints = platform === 'linkedin'
    ? 'LinkedIn post: 150-300 words. Include 3-5 relevant hashtags. Use line breaks for readability.'
    : 'Twitter post: MAXIMUM 280 characters including hashtags. Include 1-2 hashtags. Be punchy and direct.';

  const maxTokens = platform === 'linkedin' ? 800 : 300;

  const systemPrompt = `You are the CEO/founder of PropWise, an AI-powered property management communication tool. You write social media posts.

VOICE:
- You talk to property managers daily. You're sharp, specific, and empathetic.
- Be opinionated. Take positions. Don't be milquetoast.
- Every post should provide value even if the reader never visits PropWise.

RULES:
- BANNED words: leverage, synergy, game-changer, cutting-edge, revolutionary, seamless, robust, excited, thrilled, delighted
- DON'T start with questions. Start with statements, numbers, or stories.
- DON'T use "we" language like "we're excited to announce." Write in first person as a founder who gets it.
- Keep it real. Reference specific PM scenarios: 2 AM texts, maintenance request floods, tenant ghosting, rent collection headaches.

${platformConstraints}`;

  const userMessage = `Write a ${platform} post.
Category: ${category}
Monthly theme: ${themeLabels[theme]}

Recent angles to AVOID repeating:
${recentAngles.slice(0, 5).map((a) => `- ${a}`).join('\n') || '(none yet)'}`;

  try {
    const { data } = await generateStructured<{ content: string; hashtags: string[] }>(
      systemPrompt,
      userMessage,
      socialPostSchema,
      { maxTokens },
    );
    if (data.content && Array.isArray(data.hashtags)) return data;
  } catch (err) {
    logger.warn('Failed to generate social post via structured output', {
      error: err instanceof Error ? err.message : 'Unknown',
    });
  }

  return {
    content: `Property management is evolving. The best PMs aren't working harder — they're working smarter with AI-powered communication tools.`,
    hashtags: ['#PropertyManagement', '#PropTech'],
  };
}
