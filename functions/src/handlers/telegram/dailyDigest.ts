import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { COLLECTIONS } from '../../shared/constants';

// ─── Daily Digest (8 AM ET, weekdays) ───────────────────────────────────────

export const telegramDailyDigest = onSchedule(
  {
    schedule: '0 8 * * 1-5',
    timeZone: 'America/New_York',
  },
  async () => {
    try {
      const { sendDailyDigest, getNotificationChatId } = await import(
        '../../services/telegram.service'
      );

      const chatId = await getNotificationChatId();
      if (!chatId) {
        logger.info('No Telegram chat configured — skipping daily digest');
        return;
      }

      // Query stats in parallel
      const yesterday = Timestamp.fromDate(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
      );

      const [pendingSnap, hotSnap, sentSnap, openedSnap] = await Promise.all([
        db.collection(COLLECTIONS.socialPosts).where('status', '==', 'draft').count().get(),
        db.collection(COLLECTIONS.leads).where('status', '==', 'hot').count().get(),
        db.collection(COLLECTIONS.emailEvents)
          .where('type', '==', 'sent')
          .where('timestamp', '>=', yesterday)
          .count().get(),
        db.collection(COLLECTIONS.emailEvents)
          .where('type', '==', 'opened')
          .where('timestamp', '>=', yesterday)
          .count().get(),
      ]);

      const emailsSent = sentSnap.data().count;
      const emailsOpened = openedSnap.data().count;
      const openRate = emailsSent > 0 ? (emailsOpened / emailsSent) * 100 : 0;

      await sendDailyDigest({
        pendingPosts: pendingSnap.data().count,
        hotLeads: hotSnap.data().count,
        emailsSentToday: emailsSent,
        openRate,
      });

      logger.info('Daily digest sent via Telegram');
    } catch (err) {
      logger.warn('Failed to send daily digest', {
        error: err instanceof Error ? err.message : 'Unknown',
      });
    }
  },
);
