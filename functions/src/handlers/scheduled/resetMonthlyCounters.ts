import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { COLLECTIONS } from '../../shared';

/**
 * Runs on the 1st of every month at midnight UTC.
 * Resets all organizations' monthlyMessageCount to 0.
 */
export const resetMonthlyCounters = onSchedule(
  { schedule: '0 0 1 * *', timeZone: 'UTC' },
  async () => {
    logger.info('Resetting monthly message counters for all organizations');

    const orgsSnap = await db.collection(COLLECTIONS.organizations).get();
    let batch = db.batch();
    let count = 0;
    let batchCount = 0;

    for (const doc of orgsSnap.docs) {
      batch.update(doc.ref, { monthlyMessageCount: 0 });
      count++;
      batchCount++;

      // Firestore batch limit is 500 writes
      if (batchCount === 500) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
        logger.info(`Reset ${count} organizations so far`);
      }
    }

    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
    }

    logger.info(`Monthly counter reset complete. ${count} organizations updated.`);
  },
);
