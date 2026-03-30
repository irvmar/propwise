import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '../shared/constants';
import { logger } from '../utils/logger';

const db = getFirestore();

// ─── Email Insights ──────────────────────────────────────────────────

interface StepMetrics {
  stepNumber: number;
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

export async function getEmailInsights(): Promise<string> {
  try {
    const thirtyDaysAgo = Timestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );

    const eventsSnap = await db
      .collection(COLLECTIONS.emailEvents)
      .where('timestamp', '>=', thirtyDaysAgo)
      .orderBy('timestamp', 'desc')
      .limit(500)
      .get();

    if (eventsSnap.empty) {
      return 'No email engagement data available from the last 30 days.';
    }

    // Group by stepNumber
    const stepMap = new Map<number, { sent: number; opened: number; clicked: number }>();

    for (const doc of eventsSnap.docs) {
      const data = doc.data();
      const step = data.stepNumber;
      const type = data.type;
      if (typeof step !== 'number' || typeof type !== 'string') continue;

      if (!stepMap.has(step)) {
        stepMap.set(step, { sent: 0, opened: 0, clicked: 0 });
      }
      const metrics = stepMap.get(step)!;

      if (type === 'sent' || type === 'delivered') metrics.sent++;
      else if (type === 'opened') metrics.opened++;
      else if (type === 'clicked') metrics.clicked++;
    }

    const steps: StepMetrics[] = Array.from(stepMap.entries())
      .map(([stepNumber, m]) => ({
        stepNumber,
        sent: m.sent,
        opened: m.opened,
        clicked: m.clicked,
        openRate: m.sent > 0 ? Math.round((m.opened / m.sent) * 100) : 0,
        clickRate: m.sent > 0 ? Math.round((m.clicked / m.sent) * 100) : 0,
      }))
      .sort((a, b) => a.stepNumber - b.stepNumber);

    const best = steps.reduce((a, b) => (a.openRate > b.openRate ? a : b));
    const worst = steps.reduce((a, b) => (a.openRate < b.openRate ? a : b));

    const lines = steps.map(
      (s) => `Step ${s.stepNumber}: ${s.openRate}% open rate, ${s.clickRate}% click rate (${s.sent} sent)`,
    );

    lines.push('');
    if (steps.length > 1) {
      lines.push(`Best performing: Step ${best.stepNumber} (${best.openRate}% opens).`);
      lines.push(`Worst performing: Step ${worst.stepNumber} (${worst.openRate}% opens) — consider rewriting.`);
    }

    return lines.join('\n');
  } catch (err) {
    logger.warn('Failed to get email insights', {
      error: err instanceof Error ? err.message : 'Unknown',
    });
    return 'Email insights unavailable.';
  }
}

// ─── Social Post Insights ────────────────────────────────────────────

export async function getSocialInsights(): Promise<string> {
  try {
    const postsSnap = await db
      .collection(COLLECTIONS.socialPosts)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    if (postsSnap.empty) {
      return 'No social post history available.';
    }

    // Group by theme + platform
    const themeMap = new Map<
      string,
      Map<string, { approved: number; rejected: number; published: number; rejectionReasons: string[] }>
    >();

    for (const doc of postsSnap.docs) {
      const data = doc.data();
      const theme = typeof data.theme === 'string' ? data.theme : 'unknown';
      const platform = typeof data.platform === 'string' ? data.platform : 'unknown';
      const status = typeof data.status === 'string' ? data.status : '';

      if (!themeMap.has(theme)) themeMap.set(theme, new Map());
      const platformMap = themeMap.get(theme)!;
      if (!platformMap.has(platform)) {
        platformMap.set(platform, { approved: 0, rejected: 0, published: 0, rejectionReasons: [] });
      }
      const metrics = platformMap.get(platform)!;

      if (status === 'approved') metrics.approved++;
      else if (status === 'rejected') {
        metrics.rejected++;
        if (typeof data.rejectedReason === 'string') metrics.rejectionReasons.push(data.rejectedReason);
      } else if (status === 'published') {
        metrics.published++;
        metrics.approved++; // published was approved first
      }
    }

    const lines: string[] = [];

    for (const [theme, platformMap] of themeMap) {
      for (const [platform, m] of platformMap) {
        const total = m.approved + m.rejected;
        if (total === 0) continue;

        const approvalRate = Math.round((m.approved / total) * 100);

        if (m.rejected > 0 && m.rejectionReasons.length > 0) {
          const uniqueReasons = [...new Set(m.rejectionReasons)].slice(0, 3).join("', '");
          lines.push(
            `Theme '${theme}' on ${platform}: ${approvalRate}% approval rate. Rejected ${m.rejected} times — reasons: '${uniqueReasons}'.`,
          );
        } else {
          lines.push(
            `Theme '${theme}' on ${platform}: ${approvalRate}% approval rate (${m.published} published).`,
          );
        }
      }
    }

    return lines.length > 0
      ? lines.join('\n')
      : 'Social post data exists but no approval/rejection patterns found.';
  } catch (err) {
    logger.warn('Failed to get social insights', {
      error: err instanceof Error ? err.message : 'Unknown',
    });
    return 'Social insights unavailable.';
  }
}

// ─── Lead Segment Insights ──────────────────────────────────────────

interface BandMetrics {
  label: string;
  total: number;
  converted: number;
  conversionRate: number;
}

export async function getLeadSegmentInsights(): Promise<string> {
  try {
    const leadsSnap = await db
      .collection(COLLECTIONS.leads)
      .limit(200)
      .get();

    if (leadsSnap.empty) {
      return 'No lead data available for segmentation.';
    }

    const bands: Record<string, { total: number; converted: number }> = {
      '<50 units': { total: 0, converted: 0 },
      '50-200 units': { total: 0, converted: 0 },
      '200+ units': { total: 0, converted: 0 },
    };

    for (const doc of leadsSnap.docs) {
      const data = doc.data();
      const size = typeof data.portfolioSize === 'number' ? data.portfolioSize : 0;
      const status = typeof data.status === 'string' ? data.status : '';

      const band = size < 50 ? '<50 units' : size <= 200 ? '50-200 units' : '200+ units';
      bands[band].total++;
      if (status === 'converted') bands[band].converted++;
    }

    const results: BandMetrics[] = Object.entries(bands).map(([label, m]) => ({
      label,
      total: m.total,
      converted: m.converted,
      conversionRate: m.total > 0 ? Math.round((m.converted / m.total) * 100) : 0,
    }));

    const best = results.reduce((a, b) => (a.conversionRate > b.conversionRate ? a : b));

    const lines = results.map(
      (b) => `${b.label}: ${b.conversionRate}% conversion (${b.converted}/${b.total} leads)`,
    );

    lines.push('');
    lines.push(`Best segment: ${best.label} at ${best.conversionRate}% conversion. Focus personalization here.`);

    return lines.join('\n');
  } catch (err) {
    logger.warn('Failed to get lead segment insights', {
      error: err instanceof Error ? err.message : 'Unknown',
    });
    return 'Lead segment insights unavailable.';
  }
}
