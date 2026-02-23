import Stripe from 'stripe';
import { logger } from '../utils/logger';

const getStripeClient = (): Stripe => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Stripe secret key not configured. Set STRIPE_SECRET_KEY env var.');
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-06-20',
  });
};

/**
 * Create a Stripe customer for an organization.
 */
export async function createCustomer(
  email: string,
  name: string,
  orgId: string,
): Promise<Stripe.Customer> {
  const stripe = getStripeClient();
  logger.info('Creating Stripe customer', { email, orgId });

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      orgId,
    },
  });

  logger.info('Stripe customer created', { customerId: customer.id, orgId });
  return customer;
}

/**
 * Create a Stripe Checkout Session for subscription billing.
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  logger.info('Creating checkout session', { customerId, priceId });

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        customerId,
      },
    },
  });

  logger.info('Checkout session created', { sessionId: session.id });
  return session;
}

/**
 * Create a Stripe Billing Portal session for managing subscriptions.
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripeClient();
  logger.info('Creating billing portal session', { customerId });

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  logger.info('Billing portal session created', { sessionUrl: session.url });
  return session;
}

/**
 * Construct and verify a Stripe webhook event from raw body and signature.
 */
export function constructWebhookEvent(
  rawBody: string | Buffer,
  signature: string,
): Stripe.Event {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured. Set STRIPE_WEBHOOK_SECRET env var.');
  }

  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}
