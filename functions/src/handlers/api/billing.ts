import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { toHttpsError } from '../../utils/errors';
import { COLLECTIONS, PLAN_TO_STRIPE_PRICE } from '../../shared';
import {
  createCustomer,
  createCheckoutSession as stripeCreateCheckoutSession,
  createBillingPortalSession as stripeCreateBillingPortalSession,
} from '../../services/stripe.service';
import { PlanTier } from '../../shared/types';

function requireAuth(request: CallableRequest): string {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }
  return request.auth.uid;
}

async function getOrgId(uid: string): Promise<string> {
  const userDoc = await db.collection(COLLECTIONS.users).doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User profile not found');
  }
  return userDoc.data()!.organizationId;
}

// ─── Create Checkout Session ──────────────────────────────────────────
export const createCheckoutSession = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const planId = request.data?.planId as PlanTier | undefined;
    if (!planId || !['growth', 'professional', 'enterprise'].includes(planId)) {
      throw new HttpsError(
        'invalid-argument',
        'planId must be one of: growth, professional, enterprise',
      );
    }

    const priceId = PLAN_TO_STRIPE_PRICE[planId];
    if (!priceId) {
      throw new HttpsError(
        'invalid-argument',
        `No Stripe price configured for plan: ${planId}`,
      );
    }

    const orgId = await getOrgId(uid);
    const orgDoc = await db.collection(COLLECTIONS.organizations).doc(orgId).get();
    if (!orgDoc.exists) {
      throw new HttpsError('not-found', 'Organization not found');
    }
    const org = orgDoc.data()!;

    // Get or create Stripe customer
    let stripeCustomerId = org.stripeCustomerId as string | undefined;
    if (!stripeCustomerId) {
      const email = request.auth!.token.email || org.settings?.escalationEmail || '';
      const customer = await createCustomer(email, org.name, orgId);
      stripeCustomerId = customer.id;

      // Save the Stripe customer ID to the org
      await orgDoc.ref.update({
        stripeCustomerId,
        updatedAt: new Date(),
      });
    }

    // Determine URLs - use the origin from the data if provided, otherwise a default
    const origin = request.data?.origin || 'https://app.propwise.ai';
    const successUrl = `${origin}/dashboard/settings?billing=success`;
    const cancelUrl = `${origin}/dashboard/settings?billing=cancelled`;

    const session = await stripeCreateCheckoutSession(
      stripeCustomerId,
      priceId,
      successUrl,
      cancelUrl,
    );

    logger.info('Checkout session created for org', {
      orgId,
      planId,
      sessionId: session.id,
    });

    return { url: session.url };
  } catch (error) {
    throw toHttpsError(error);
  }
});

// ─── Create Billing Portal Session ────────────────────────────────────
export const createBillingPortalSession = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const orgId = await getOrgId(uid);
    const orgDoc = await db.collection(COLLECTIONS.organizations).doc(orgId).get();
    if (!orgDoc.exists) {
      throw new HttpsError('not-found', 'Organization not found');
    }
    const org = orgDoc.data()!;

    const stripeCustomerId = org.stripeCustomerId as string | undefined;
    if (!stripeCustomerId) {
      throw new HttpsError(
        'failed-precondition',
        'No billing account found. Please subscribe to a plan first.',
      );
    }

    const origin = request.data?.origin || 'https://app.propwise.ai';
    const returnUrl = `${origin}/dashboard/settings`;

    const session = await stripeCreateBillingPortalSession(stripeCustomerId, returnUrl);

    logger.info('Billing portal session created for org', {
      orgId,
      sessionUrl: session.url,
    });

    return { url: session.url };
  } catch (error) {
    throw toHttpsError(error);
  }
});
