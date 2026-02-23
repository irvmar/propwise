import { HttpsError } from 'firebase-functions/v2/https';
import { db } from './firebase';
import {
  COLLECTIONS,
  PLAN_TIERS,
  PLAN_ORDER,
  PlanTier,
  PlanConfig,
  Organization,
} from '../shared';

export interface OrgPlanInfo {
  plan: PlanTier;
  config: PlanConfig;
  org: Organization;
}

/**
 * Load org data and resolve its plan config.
 */
export async function getOrgPlanInfo(orgId: string): Promise<OrgPlanInfo> {
  const orgDoc = await db.collection(COLLECTIONS.organizations).doc(orgId).get();
  if (!orgDoc.exists) {
    throw new HttpsError('not-found', 'Organization not found');
  }
  const org = { id: orgDoc.id, ...orgDoc.data() } as Organization;
  const plan = (org.plan || 'starter') as PlanTier;
  const config = PLAN_TIERS[plan];
  return { plan, config, org };
}

/**
 * Throw if the org has reached its property limit.
 */
export function enforcePropertyLimit(org: Organization, config: PlanConfig): void {
  if (config.maxProperties !== -1 && (org.propertyCount || 0) >= config.maxProperties) {
    throw new HttpsError(
      'resource-exhausted',
      `Your ${config.name} plan allows up to ${config.maxProperties} propert${config.maxProperties === 1 ? 'y' : 'ies'}. Upgrade your plan to add more.`,
    );
  }
}

/**
 * Throw if the org has reached its unit limit.
 */
export function enforceUnitLimit(org: Organization, config: PlanConfig): void {
  if (config.maxUnits !== -1 && (org.unitCount || 0) >= config.maxUnits) {
    throw new HttpsError(
      'resource-exhausted',
      `Your ${config.name} plan allows up to ${config.maxUnits} units. Upgrade your plan to add more.`,
    );
  }
}

/**
 * Check if the org's monthly message count has reached its limit.
 * Returns true if the message is allowed, false if the limit is reached.
 */
export function isWithinMessageLimit(org: Organization, config: PlanConfig): boolean {
  if (config.maxMessages === -1) return true;
  return (org.monthlyMessageCount || 0) < config.maxMessages;
}

/**
 * Throw if the current plan does not meet the minimum required plan.
 */
export function enforceFeatureAccess(currentPlan: PlanTier, requiredPlan: PlanTier): void {
  const currentIndex = PLAN_ORDER.indexOf(currentPlan);
  const requiredIndex = PLAN_ORDER.indexOf(requiredPlan);
  if (currentIndex < requiredIndex) {
    const requiredConfig = PLAN_TIERS[requiredPlan];
    throw new HttpsError(
      'permission-denied',
      `This feature requires the ${requiredConfig.name} plan or higher. Upgrade your plan to access it.`,
    );
  }
}
