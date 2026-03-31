import { onRequest } from 'firebase-functions/v2/https';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { COLLECTIONS, getMarketingAdminEmails } from '../../shared/constants';
import {
  verifyTelegramWebhook,
  sendMessage,
  sendPhoto,
  answerCallbackQuery,
  editMessageText,
  buildApprovalKeyboard,
  buildBulkApprovalKeyboard,
  getNotificationChatId,
} from '../../services/telegram.service';

// ─── Webhook Handler ────────────────────────────────────────────────────────

export const telegramWebhook = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  // Verify secret token header (set via setWebhook secret_token parameter)
  if (!verifyTelegramWebhook(req)) {
    logger.warn('Invalid Telegram webhook signature');
    res.status(401).send('Unauthorized');
    return;
  }

  try {
    const update = req.body;

    if (update.message?.text) {
      await handleCommand(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }

    // Always return 200 to Telegram
    res.status(200).json({ ok: true });
  } catch (error) {
    logger.error('Telegram webhook error', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    // Still return 200 — Telegram retries on non-200
    res.status(200).json({ ok: true });
  }
});

// ─── Command Handler ────────────────────────────────────────────────────────

interface TelegramMessage {
  chat: { id: number };
  from?: { id: number; first_name?: string };
  text?: string;
}

async function handleCommand(message: TelegramMessage): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text || '';
  const userId = message.from?.id;

  if (text.startsWith('/start')) {
    await handleStart(chatId, userId, text);
  } else if (text.startsWith('/status')) {
    await handleStatus(chatId);
  } else if (text.startsWith('/pending')) {
    await handlePending(chatId);
  } else {
    await sendMessage(chatId, 'Available commands:\n/start &lt;email&gt;\n/status\n/pending');
  }
}

async function handleStart(chatId: number, userId: number | undefined, text: string): Promise<void> {
  const parts = text.split(' ');
  const email = parts[1]?.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    await sendMessage(chatId, 'Please provide your admin email:\n<code>/start youremail@example.com</code>');
    return;
  }

  const admins = getMarketingAdminEmails();
  if (!admins.includes(email)) {
    await sendMessage(chatId, 'This email is not authorized as a marketing admin.');
    return;
  }

  // Save session
  await db.collection(COLLECTIONS.telegramSessions).doc(String(userId || chatId)).set({
    telegramUserId: userId || chatId,
    chatId,
    email,
    registeredAt: Timestamp.now(),
  });

  // Set as primary notification target
  await db.collection(COLLECTIONS.marketingSettings).doc('global').set(
    { telegramChatId: chatId },
    { merge: true },
  );

  await sendMessage(
    chatId,
    `<b>Welcome to PropWise Marketing Bot</b>\n\n` +
    `Registered as: ${email}\n\n` +
    `You'll receive:\n` +
    `- New content previews with approval buttons\n` +
    `- Hot lead alerts\n` +
    `- Daily marketing digest\n` +
    `- Guided publishing instructions\n\n` +
    `Commands:\n` +
    `/status — current marketing stats\n` +
    `/pending — review pending posts`,
  );

  logger.info('Telegram admin registered', { chatId, email });
}

async function handleStatus(chatId: number): Promise<void> {
  // Query current stats
  const [pendingSnap, hotSnap, publishedSnap] = await Promise.all([
    db.collection(COLLECTIONS.socialPosts).where('status', '==', 'draft').count().get(),
    db.collection(COLLECTIONS.leads).where('status', '==', 'hot').count().get(),
    db.collection(COLLECTIONS.socialPosts).where('status', '==', 'published').count().get(),
  ]);

  const pending = pendingSnap.data().count;
  const hot = hotSnap.data().count;
  const published = publishedSnap.data().count;

  await sendMessage(
    chatId,
    `<b>Marketing Status</b>\n\n` +
    `Posts pending approval: <b>${pending}</b>\n` +
    `Posts published: <b>${published}</b>\n` +
    `Hot leads: <b>${hot}</b>`,
  );
}

async function handlePending(chatId: number): Promise<void> {
  const postsSnap = await db.collection(COLLECTIONS.socialPosts)
    .where('status', '==', 'draft')
    .orderBy('scheduledFor', 'asc')
    .limit(10)
    .get();

  if (postsSnap.empty) {
    await sendMessage(chatId, 'No pending posts to review.');
    return;
  }

  const campaignWeek = postsSnap.docs[0].data().campaignWeek;
  await sendMessage(
    chatId,
    `<b>${postsSnap.size} posts pending review</b> (${campaignWeek})`,
    buildBulkApprovalKeyboard(campaignWeek),
  );

  for (const doc of postsSnap.docs) {
    const post = doc.data();
    const preview = (post.content || '').slice(0, 200);
    const tags = (post.hashtags || []).slice(0, 3).join(' ');
    const caption =
      `<b>${(post.platform || '').toUpperCase()}</b> | ${post.dayOfWeek || ''}\n\n` +
      `${escapeHtml(preview)}${post.content?.length > 200 ? '...' : ''}\n` +
      `${tags}`;

    try {
      if (post.imageUrl) {
        await sendPhoto(chatId, post.imageUrl, caption, buildApprovalKeyboard(doc.id));
      } else {
        await sendMessage(chatId, caption, buildApprovalKeyboard(doc.id));
      }
    } catch (err) {
      logger.warn('Failed to send pending post', { postId: doc.id });
    }

    await new Promise((r) => setTimeout(r, 200));
  }
}

// ─── Callback Query Handler ─────────────────────────────────────────────────

interface TelegramCallbackQuery {
  id: string;
  from: { id: number };
  message?: { chat: { id: number }; message_id: number };
  data?: string;
}

async function handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
  const data = query.data || '';
  const chatId = query.message?.chat.id;
  const messageId = query.message?.message_id;

  const underscoreIdx = data.indexOf('_');
  if (underscoreIdx === -1) {
    await answerCallbackQuery(query.id, 'Invalid action');
    return;
  }

  const action = data.substring(0, underscoreIdx);
  const identifier = data.substring(underscoreIdx + 1);

  switch (action) {
    case 'approve':
      await handleApprove(query.id, identifier, chatId, messageId);
      break;
    case 'reject':
      await handleReject(query.id, identifier, chatId, messageId);
      break;
    case 'approveall':
      await handleApproveAll(query.id, identifier, chatId, messageId);
      break;
    case 'posted':
      await handlePosted(query.id, identifier, chatId, messageId);
      break;
    default:
      await answerCallbackQuery(query.id, 'Unknown action');
  }
}

async function handleApprove(
  queryId: string, postId: string, chatId?: number, messageId?: number,
): Promise<void> {
  const ref = db.collection(COLLECTIONS.socialPosts).doc(postId);
  const doc = await ref.get();

  if (!doc.exists) {
    await answerCallbackQuery(queryId, 'Post not found');
    return;
  }

  if (doc.data()?.status === 'approved') {
    await answerCallbackQuery(queryId, 'Already approved');
    return;
  }

  await ref.update({
    status: 'approved',
    approvedBy: 'telegram',
    approvedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await answerCallbackQuery(queryId, 'Post approved!');

  if (chatId && messageId) {
    try {
      await editMessageText(chatId, messageId, '✅ <b>Approved</b>');
    } catch {
      // Message may have been deleted or expired
    }
  }

  logger.info('Post approved via Telegram', { postId });
}

async function handleReject(
  queryId: string, postId: string, chatId?: number, messageId?: number,
): Promise<void> {
  const ref = db.collection(COLLECTIONS.socialPosts).doc(postId);
  const doc = await ref.get();

  if (!doc.exists) {
    await answerCallbackQuery(queryId, 'Post not found');
    return;
  }

  await ref.update({
    status: 'rejected',
    rejectedReason: 'Rejected via Telegram',
    updatedAt: Timestamp.now(),
  });

  await answerCallbackQuery(queryId, 'Post rejected');

  if (chatId && messageId) {
    try {
      await editMessageText(chatId, messageId, '❌ <b>Rejected</b>');
    } catch {
      // Message may have been deleted or expired
    }
  }

  logger.info('Post rejected via Telegram', { postId });
}

async function handleApproveAll(
  queryId: string, campaignWeek: string, chatId?: number, messageId?: number,
): Promise<void> {
  const postsSnap = await db.collection(COLLECTIONS.socialPosts)
    .where('status', '==', 'draft')
    .where('campaignWeek', '==', campaignWeek)
    .get();

  if (postsSnap.empty) {
    await answerCallbackQuery(queryId, 'No draft posts found');
    return;
  }

  const batch = db.batch();
  for (const doc of postsSnap.docs) {
    batch.update(doc.ref, {
      status: 'approved',
      approvedBy: 'telegram',
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  await batch.commit();

  await answerCallbackQuery(queryId, `${postsSnap.size} posts approved!`);

  if (chatId && messageId) {
    try {
      await editMessageText(chatId, messageId, `✅ <b>${postsSnap.size} posts approved</b> (${campaignWeek})`);
    } catch {
      // Message may have been deleted or expired
    }
  }

  logger.info('Bulk approved via Telegram', { campaignWeek, count: postsSnap.size });
}

async function handlePosted(
  queryId: string, postId: string, chatId?: number, messageId?: number,
): Promise<void> {
  const ref = db.collection(COLLECTIONS.socialPosts).doc(postId);
  const doc = await ref.get();

  if (!doc.exists) {
    await answerCallbackQuery(queryId, 'Post not found');
    return;
  }

  await ref.update({
    manuallyPosted: true,
    manuallyPostedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await answerCallbackQuery(queryId, 'Marked as posted!');

  if (chatId && messageId) {
    try {
      await editMessageText(chatId, messageId, '✅ <b>Posted</b> — marked as complete');
    } catch {
      // Message may have been deleted or expired
    }
  }

  logger.info('Post marked as manually posted via Telegram', { postId });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
