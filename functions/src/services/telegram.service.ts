import { Bot, InlineKeyboard } from 'grammy';
import { db } from '../utils/firebase';
import { logger } from '../utils/logger';
import { COLLECTIONS } from '../shared/constants';
import { SocialPlatform } from '../shared';

// ─── Singleton ──────────────────────────────────────────────────────────────

let bot: Bot | null = null;

function getBot(): Bot {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');
    bot = new Bot(token);
  }
  return bot;
}

// ─── Chat ID Resolution ────────────────────────────────────────────────────

export async function getNotificationChatId(): Promise<number | null> {
  // Primary: marketingSettings/global.telegramChatId
  const settingsDoc = await db
    .collection(COLLECTIONS.marketingSettings)
    .doc('global')
    .get();

  if (settingsDoc.exists) {
    const chatId = settingsDoc.data()?.telegramChatId;
    if (chatId) return chatId as number;
  }

  // Fallback: first registered session
  const sessionSnap = await db
    .collection(COLLECTIONS.telegramSessions)
    .limit(1)
    .get();

  if (!sessionSnap.empty) {
    return sessionSnap.docs[0].data().chatId as number;
  }

  return null;
}

// ─── Core Message Functions ─────────────────────────────────────────────────

export async function sendMessage(
  chatId: number,
  text: string,
  keyboard?: InlineKeyboard,
): Promise<number> {
  const b = getBot();
  const msg = await b.api.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
  return msg.message_id;
}

export async function sendPhoto(
  chatId: number,
  photoUrl: string,
  caption: string,
  keyboard?: InlineKeyboard,
): Promise<number> {
  const b = getBot();
  const msg = await b.api.sendPhoto(chatId, photoUrl, {
    caption,
    parse_mode: 'HTML',
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
  return msg.message_id;
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  keyboard?: InlineKeyboard,
): Promise<void> {
  const b = getBot();
  await b.api.editMessageText(chatId, messageId, text, {
    parse_mode: 'HTML',
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  const b = getBot();
  await b.api.answerCallbackQuery(callbackQueryId, { text });
}

// ─── Keyboard Builders ──────────────────────────────────────────────────────

export function buildApprovalKeyboard(postId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('✓ Approve', `approve_${postId}`)
    .text('✗ Reject', `reject_${postId}`);
}

export function buildBulkApprovalKeyboard(campaignWeek: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('✓ Approve All This Week', `approveall_${campaignWeek}`);
}

export function buildPostedKeyboard(postId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('✓ Mark as Posted', `posted_${postId}`);
}

// ─── Webhook Verification ───────────────────────────────────────────────────

export function verifyTelegramWebhook(
  req: { headers: Record<string, string | string[] | undefined> },
): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return false;

  const token = req.headers['x-telegram-bot-api-secret-token'] as string;
  return token === secret;
}

// ─── Notification Helpers (fire-and-forget) ─────────────────────────────────

interface PostPreview {
  id: string;
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  imageUrl?: string | null;
  dayOfWeek: string;
  campaignWeek: string;
}

export async function notifyNewContent(posts: PostPreview[]): Promise<void> {
  const chatId = await getNotificationChatId();
  if (!chatId || posts.length === 0) return;

  // Summary message
  const platforms = [...new Set(posts.map((p) => p.platform))];
  await sendMessage(
    chatId,
    `<b>New content generated</b>\n\n` +
    `${posts.length} posts ready for review\n` +
    `Platforms: ${platforms.join(', ')}\n` +
    `Week: ${posts[0].campaignWeek}`,
    buildBulkApprovalKeyboard(posts[0].campaignWeek),
  );

  // Individual post previews
  for (const post of posts) {
    const preview = escapeHtml(post.content.slice(0, 200));
    const tags = post.hashtags.slice(0, 3).join(' ');
    const caption =
      `<b>${post.platform.toUpperCase()}</b> | ${post.dayOfWeek}\n\n` +
      `${preview}${post.content.length > 200 ? '...' : ''}\n` +
      `${tags}`;

    try {
      if (post.imageUrl) {
        const msgId = await sendPhoto(chatId, post.imageUrl, caption, buildApprovalKeyboard(post.id));
        // Store message ID for later editing
        await db.collection(COLLECTIONS.socialPosts).doc(post.id).update({ telegramMessageId: msgId });
      } else {
        const msgId = await sendMessage(chatId, caption, buildApprovalKeyboard(post.id));
        await db.collection(COLLECTIONS.socialPosts).doc(post.id).update({ telegramMessageId: msgId });
      }
    } catch (err) {
      logger.warn('Failed to send post preview to Telegram', {
        postId: post.id,
        error: err instanceof Error ? err.message : 'Unknown',
      });
    }

    // Rate limit: 200ms between messages
    await new Promise((r) => setTimeout(r, 200));
  }
}

export async function notifyHotLead(lead: {
  name: string;
  email: string;
  company?: string;
  score: number;
  source: string;
}): Promise<void> {
  const chatId = await getNotificationChatId();
  if (!chatId) return;

  await sendMessage(
    chatId,
    `<b>Hot Lead Alert</b>\n\n` +
    `<b>${escapeHtml(lead.name)}</b>\n` +
    `${escapeHtml(lead.email)}\n` +
    (lead.company ? `Company: ${escapeHtml(lead.company)}\n` : '') +
    `Score: ${lead.score}\n` +
    `Source: ${lead.source}\n\n` +
    `This lead is showing strong engagement.`,
  );
}

export async function notifyBounceAlert(
  bounceRate: number,
  threshold: number,
): Promise<void> {
  const chatId = await getNotificationChatId();
  if (!chatId) return;

  await sendMessage(
    chatId,
    `<b>Email Bounce Alert</b>\n\n` +
    `Bounce rate: <b>${bounceRate.toFixed(1)}%</b> (threshold: ${threshold}%)\n\n` +
    `Consider reviewing your email list for invalid addresses.`,
  );
}

export async function sendDailyDigest(stats: {
  pendingPosts: number;
  hotLeads: number;
  emailsSentToday: number;
  openRate: number;
}): Promise<void> {
  const chatId = await getNotificationChatId();
  if (!chatId) return;

  const lines = [
    '<b>Daily Marketing Digest</b>',
    '',
    `Posts pending approval: <b>${stats.pendingPosts}</b>`,
    `Hot leads: <b>${stats.hotLeads}</b>`,
    `Emails sent (24h): <b>${stats.emailsSentToday}</b>`,
    `Open rate: <b>${stats.openRate.toFixed(1)}%</b>`,
  ];

  if (stats.pendingPosts > 0) {
    lines.push('', 'Use /pending to review and approve posts.');
  }

  await sendMessage(chatId, lines.join('\n'));
}

export async function sendGuidedPublishingMessage(post: {
  id: string;
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  imageUrl?: string | null;
}): Promise<void> {
  const chatId = await getNotificationChatId();
  if (!chatId) return;

  const fullText = `${post.content}\n\n${post.hashtags.join(' ')}`;
  const charCount = fullText.length;

  let header: string;
  let composeLink: string;

  if (post.platform === 'linkedin') {
    header = 'Ready to Post on LinkedIn';
    composeLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://propwise.ai')}`;
  } else {
    const tweetText = charCount <= 280 ? fullText : post.content.slice(0, 250);
    header = `Ready to Post on Twitter/X`;
    composeLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  }

  const charLabel = post.platform === 'twitter'
    ? `\nCharacters: <b>${charCount}/280</b>${charCount > 280 ? ' (over limit!)' : ''}`
    : '';

  const caption =
    `<b>${header}</b>${charLabel}\n\n` +
    `───────────────────\n\n` +
    `${escapeHtml(fullText)}\n\n` +
    `───────────────────\n\n` +
    `<a href="${composeLink}">Open ${post.platform === 'linkedin' ? 'LinkedIn' : 'Twitter'} to post</a>`;

  if (post.imageUrl) {
    await sendPhoto(chatId, post.imageUrl, caption, buildPostedKeyboard(post.id));
  } else {
    await sendMessage(chatId, caption, buildPostedKeyboard(post.id));
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
