import { onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { constructWebhookEvent } from '../../services/stripe.service';
import { COLLECTIONS, STRIPE_PRICE_IDS } from '../../shared';
import { PlanTier } from '../../shared/types';

/**
 * Stripe webhook handler.
 * Must be an HTTP onRequest function (not onCall) because Stripe sends raw POST requests
 * and we need the raw body for signature verification.
 */
export const stripeWebhook = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const signature = req.headers['stripe-signature'] as string;
  if (!signature) {
    logger.warn('Missing stripe-signature header');
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(req.rawBody, signature);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Webhook signature verification failed', { error: message });
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  logger.info('Stripe webhook event received', { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    res.status(200).json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Error processing webhook event', { type: event.type, error: message });
    res.status(500).send('Webhook handler error');
  }
});

/**
 * Handle checkout.session.completed:
 * Update the org with stripeCustomerId, stripeSubscriptionId, and the new plan.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) {
    logger.warn('Checkout session missing customer or subscription', { sessionId: session.id });
    return;
  }

  // Find the org by stripeCustomerId
  const orgSnap = await db.collection(COLLECTIONS.organizations)
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (orgSnap.empty) {
    logger.error('No organization found for Stripe customer', { customerId });
    return;
  }

  const orgRef = orgSnap.docs[0].ref;

  // Determine the plan from the session metadata or subscription items
  // We'll resolve the plan from the subscription in the subscription.updated handler
  // For now, just set the IDs and clear any payment failure flag
  await orgRef.update({
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    paymentFailed: false,
    updatedAt: new Date(),
  });

  logger.info('Checkout completed - org updated', {
    orgId: orgSnap.docs[0].id,
    customerId,
    subscriptionId,
  });
}

/**
 * Handle customer.subscription.updated:
 * Map the current price ID to a plan tier and update the org.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;

  const orgSnap = await db.collection(COLLECTIONS.organizations)
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (orgSnap.empty) {
    logger.error('No organization found for Stripe customer', { customerId });
    return;
  }

  const orgRef = orgSnap.docs[0].ref;

  // Get the price ID from the first subscription item
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) {
    logger.warn('Subscription has no price ID', { subscriptionId: subscription.id });
    return;
  }

  const plan: PlanTier | undefined = STRIPE_PRICE_IDS[priceId];
  if (!plan) {
    logger.warn('Unknown Stripe price ID', { priceId });
    return;
  }

  await orgRef.update({
    plan,
    stripeSubscriptionId: subscription.id,
    paymentFailed: false,
    updatedAt: new Date(),
  });

  logger.info('Subscription updated - org plan changed', {
    orgId: orgSnap.docs[0].id,
    plan,
    priceId,
  });
}

/**
 * Handle customer.subscription.deleted:
 * Downgrade the org to the free 'starter' plan.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;

  const orgSnap = await db.collection(COLLECTIONS.organizations)
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (orgSnap.empty) {
    logger.error('No organization found for Stripe customer', { customerId });
    return;
  }

  const orgRef = orgSnap.docs[0].ref;
  await orgRef.update({
    plan: 'starter',
    stripeSubscriptionId: null,
    paymentFailed: false,
    updatedAt: new Date(),
  });

  logger.info('Subscription deleted - org downgraded to starter', {
    orgId: orgSnap.docs[0].id,
    customerId,
  });
}

/**
 * Handle invoice.payment_failed:
 * Flag the org with paymentFailed: true.
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;
  if (!customerId) {
    logger.warn('Invoice missing customer ID', { invoiceId: invoice.id });
    return;
  }

  const orgSnap = await db.collection(COLLECTIONS.organizations)
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (orgSnap.empty) {
    logger.error('No organization found for Stripe customer', { customerId });
    return;
  }

  const orgRef = orgSnap.docs[0].ref;
  await orgRef.update({
    paymentFailed: true,
    updatedAt: new Date(),
  });

  logger.info('Payment failed - org flagged', {
    orgId: orgSnap.docs[0].id,
    customerId,
    invoiceId: invoice.id,
  });
}
