import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from '../../utils/logger';
import { COLLECTIONS, getMarketingAdminEmails } from '../../shared/constants';
import { generateStructured } from '../../services/claude.service';
import { generatePostImage } from '../../services/imagen.service';
import { getSocialInsights } from '../../services/marketing-insights.service';
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

  // Fetch performance insights for Claude prompts
  const socialInsights = await getSocialInsights();
  logger.info('Social insights loaded for content generation', { insightsLength: socialInsights.length });

  // Fetch last 20 posts (any non-rejected status) to avoid repeating angles
  const recentSnap = await db.collection(COLLECTIONS.socialPosts)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  const recentAngles = recentSnap.docs
    .filter((d) => d.data().status !== 'rejected')
    .map((d) => d.data().content.substring(0, 100));

  // Get next Monday's date
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
  monday.setHours(0, 0, 0, 0);

  const batch = db.batch();
  let postCount = 0;
  const postPreviews: Array<{ id: string; platform: string; content: string; hashtags: string[]; imageUrl: string | null; dayOfWeek: string; campaignWeek: string }> = [];

  for (const slot of WEEKLY_CALENDAR) {
    for (const platform of slot.platforms) {
      try {
        const { content, hashtags } = await generatePost(
          platform,
          slot.category,
          theme,
          recentAngles,
          socialInsights,
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
        postPreviews.push({ id: ref.id, platform, content, hashtags, imageUrl, dayOfWeek: slot.dayOfWeek, campaignWeek });

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

  // Notify via Telegram (fire-and-forget)
  if (postPreviews.length > 0) {
    import('../../services/telegram.service')
      .then(({ notifyNewContent }) => notifyNewContent(postPreviews as Parameters<typeof notifyNewContent>[0]))
      .catch((err) => logger.warn('Telegram notification failed', { error: err instanceof Error ? err.message : 'Unknown' }));
  }

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

const BRAND = 'Use only these colors: deep navy (#1a365d), bright teal (#0ea5e9), warm amber (#f59e0b), white (#ffffff), and slate gray (#64748b).';

const CATEGORY_PROMPTS: Record<string, string[]> = {
  'Industry Insights': [
    `Generate an image of a bold data visualization graphic for a property management SaaS company. A dramatic upward trend line in bright teal (#0ea5e9) sweeps across a deep navy (#1a365d) background, with glowing data points along the curve. Subtle grid lines and small floating stat callouts in white create depth. The design feels like a premium analyst report from McKinsey. {FORMAT}. ${BRAND}`,
    `Generate an image of an overhead drone-style view of a modern city neighborhood at golden hour, with apartment buildings connected by glowing teal (#0ea5e9) network lines representing a connected property management ecosystem. Warm evening light on buildings contrasts with cool digital overlay. Cinematic color grading, photorealistic. {FORMAT}.`,
    `Generate an image of a split-screen comparison infographic. Left half: a chaotic property manager desk with sticky notes, ringing phone, overflowing inbox in muted desaturated tones. Right half: a clean modern workspace with a sleek laptop showing a property dashboard with green checkmarks, rendered in cool blues and teals. Bold diagonal dividing line. Clean editorial illustration style. {FORMAT}. ${BRAND}`,
  ],
  'Product Education': [
    `Generate an image of a smartphone floating center-frame displaying a text conversation between a tenant reporting a maintenance issue and an AI assistant scheduling a repair instantly. Radiating outward: glowing icons for a wrench, clock, dollar sign, house, and chat bubble. Background is a soft gradient from deep navy to dark teal. Polished tech product marketing visual with subtle glow effects. {FORMAT}. ${BRAND}`,
    `Generate an image of a step-by-step workflow illustration with three connected panels in clean flat design: Panel 1 shows a tenant texting (phone with speech bubble), Panel 2 shows AI processing (circuit brain with lightbulb), Panel 3 shows a property manager receiving a summary (laptop with green checkmark). Connected by flowing teal arrows on white background. Bold modern sans-serif labels. {FORMAT}. ${BRAND}`,
    `Generate an image of three phone mockups side by side on deep navy (#1a365d) background with subtle dot grid. Left phone: incoming tenant messages. Center phone (larger, elevated): AI processing with glowing teal brain icon. Right phone: resolved conversation with green checkmark. Thin glowing teal lines connect them. Sleek, minimal, tech-forward. {FORMAT}. ${BRAND}`,
  ],
  'Customer Stories': [
    `Generate an image of a confident property manager standing in the lobby of a modern apartment building, holding a tablet showing positive metrics. Contemporary architecture with clean lines, warm wood accents, large windows with natural light. Smart business casual attire, genuine relaxed smile. Shot with 85mm portrait lens, shallow depth of field blurring the lobby. Warm natural lighting. {FORMAT}.`,
    `Generate an image of a bold results graphic on white background. A large circular gauge in the center shows a metric improving from red to green. Surrounding it: three rounded stat callouts with navy backgrounds and white text. Uses navy (#1a365d), teal (#0ea5e9), amber (#f59e0b), and green (#10b981). Clean modern infographic with subtle drop shadows. {FORMAT}. ${BRAND}`,
    `Generate an image of a before-and-after transformation banner. Left side: stressed property manager surrounded by chaotic floating notifications in warm red tones. Right side: same person relaxed with a clean laptop showing organized dashboard, AI icon handling notifications orderly. Diagonal gradient transition from warm to cool. Clean editorial illustration style. {FORMAT}. ${BRAND}`,
  ],
  'Community Engagement': [
    `Generate an image of a warm isometric illustration of a small neighborhood with three apartment buildings, a well-maintained green courtyard, and small figures of happy residents. Warm afternoon lighting with soft shadows. The color palette uses soft blues, greens, and warm earth tones. Polished isometric vector illustration style, inviting and community-oriented. {FORMAT}.`,
    `Generate an image of two property managers having a friendly conversation in a bright modern co-working space, one gesturing toward a whiteboard with property icons. Warm and approachable flat design with rounded shapes. Navy, teal, and amber on clean white background. Modern SaaS illustration style similar to Notion or Slack marketing. {FORMAT}. ${BRAND}`,
    `Generate an image of a vibrant community scene: modern apartment building courtyard with a small gathering of diverse residents. String lights overhead, potted plants, a bulletin board. Warm golden hour lighting. Photorealistic with a welcoming, lived-in feel. Shot with wide-angle lens capturing the full communal space. {FORMAT}.`,
  ],
  'Thought Leadership': [
    `Generate an image of a modern apartment building facade at dusk with subtle digital overlay: holographic data points, connection lines, and small AI nodes floating near windows. Building is photorealistic with warm brick and glass, digital elements in glowing teal (#0ea5e9) with subtle transparency. Near-future feel, not sci-fi. Cinematic low-angle perspective. {FORMAT}.`,
    `Generate an image of a conceptual illustration showing three stages of property management evolution flowing left to right: Stage 1 (sepia tones) vintage desk with rotary phone and paper ledger. Stage 2 (gray tones) desktop computer with spreadsheets. Stage 3 (vibrant navy and teal) sleek laptop with AI conversation and digital key. Connected by a timeline arrow. Clean editorial illustration. {FORMAT}. ${BRAND}`,
    `Generate an image of a dramatic bird's-eye view of a modern city neighborhood. Apartment buildings glow with warm interior light against a twilight sky. Bright teal (#0ea5e9) network lines connect buildings, representing a smart property ecosystem. Photorealistic with cinematic color grading — warm highlights, cool shadows. Drone photography style at golden hour. {FORMAT}.`,
  ],
};

function buildImagePrompt(postContent: string, platform: SocialPlatform, category: string): string {
  const templates = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS['Industry Insights'];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const format = platform === 'linkedin'
    ? 'Square format, 1:1 aspect ratio'
    : 'Landscape format, 16:9 aspect ratio';
  return template.replace('{FORMAT}', format);
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
  socialInsights: string,
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

${platformConstraints}

PERFORMANCE DATA — Here's what's working and what's not based on recent post approvals/rejections. Use this to guide your tone, theme emphasis, and content approach. Double down on what gets approved; avoid patterns that got rejected:
${socialInsights}`;

  const userMessage = `Write a ${platform} post.
Category: ${category}
Monthly theme: ${themeLabels[theme]}

Recent angles to AVOID repeating:
${recentAngles.slice(0, 5).map((a) => `- ${a}`).join('\n') || '(none yet)'}`;

  const { data } = await generateStructured<{ content: string; hashtags: string[] }>(
    systemPrompt,
    userMessage,
    socialPostSchema,
    { maxTokens },
  );

  if (!data.content || !Array.isArray(data.hashtags)) {
    throw new Error('Invalid structured output from Claude');
  }

  // Enforce Twitter 280-char limit
  if (platform === 'twitter') {
    const hashtagStr = data.hashtags.length > 0 ? ' ' + data.hashtags.join(' ') : '';
    const totalLength = data.content.length + hashtagStr.length;
    if (totalLength > 280) {
      const maxContent = 280 - hashtagStr.length - 1; // -1 for ellipsis
      data.content = data.content.substring(0, maxContent).trimEnd() + '…';
    }
  }

  return data;
}
