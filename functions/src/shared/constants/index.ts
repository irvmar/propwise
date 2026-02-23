import { IntentCategory, WorkOrderCategory, WorkOrderPriority, WorkOrderStatus, PlanTier } from '../types';

export const INTENT_CATEGORIES: IntentCategory[] = [
  'maintenance', 'rent_inquiry', 'lease_question', 'emergency',
  'complaint', 'general_inquiry', 'greeting', 'status_inquiry', 'unknown',
];

export const WORK_ORDER_CATEGORIES: WorkOrderCategory[] = [
  'plumbing', 'electrical', 'hvac', 'appliance', 'structural',
  'pest_control', 'landscaping', 'cleaning', 'painting',
  'flooring', 'roofing', 'locksmith', 'general', 'other',
];

export const WORK_ORDER_STATUSES: WorkOrderStatus[] = [
  'new', 'vendor_contacted', 'assigned', 'scheduled', 'in_progress',
  'pending_parts', 'completed', 'cancelled', 'escalated',
];

export const WORK_ORDER_PRIORITIES: WorkOrderPriority[] = [
  'emergency', 'high', 'medium', 'low',
];

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  new: 'Received',
  vendor_contacted: 'Finding a technician',
  assigned: 'Technician assigned',
  scheduled: 'Visit scheduled',
  in_progress: 'Work in progress',
  pending_parts: 'Waiting for parts',
  completed: 'Completed',
  cancelled: 'Cancelled',
  escalated: 'Escalated to management',
};

export const MAX_MESSAGES_PER_HOUR = 20;

export const ESCALATION_KEYWORDS = [
  'help', 'manager', 'human', 'speak to someone', 'real person',
  'talk to someone', 'speak to manager', 'talk to manager',
];

export const DEFAULT_EMERGENCY_KEYWORDS = [
  'flood', 'flooding', 'fire', 'gas leak', 'gas smell', 'no heat',
  'no hot water', 'broken pipe', 'burst pipe', 'sewage', 'smoke',
  'carbon monoxide', 'co detector', 'electrical fire', 'sparking',
  'ceiling collapse', 'break in', 'break-in', 'intruder', 'locked out',
  'no electricity', 'power out', 'water leak', 'emergency',
];

export const PLAN_TIERS: Record<PlanTier, PlanConfig> = {
  starter: {
    name: 'Free',
    price: 0,
    maxProperties: 1,
    maxUnits: 5,
    maxMessages: 50,
    features: ['AI SMS Agent', 'Work Order Tracking', 'Basic Dashboard', 'Email Support'],
  },
  growth: {
    name: 'Growth',
    price: 99,
    maxProperties: 3,
    maxUnits: 50,
    maxMessages: 500,
    features: [
      'Everything in Free',
      'Knowledge Base',
      'Vendor Management',
      'Rent Reminders',
      'Priority Support',
    ],
  },
  professional: {
    name: 'Professional',
    price: 199,
    maxProperties: 10,
    maxUnits: 150,
    maxMessages: 2000,
    features: [
      'Everything in Growth',
      'Maintenance Coordination',
      'Advanced Analytics',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 349,
    maxProperties: -1, // unlimited
    maxUnits: 500,
    maxMessages: 5000,
    features: [
      'Everything in Professional',
      'Unlimited Properties',
      'API Access',
      'Dedicated Account Manager',
      'Custom Integrations',
      'SLA Guarantee',
    ],
  },
};

// Stripe price IDs — set via environment variables:
//   STRIPE_PRICE_GROWTH, STRIPE_PRICE_PROFESSIONAL, STRIPE_PRICE_ENTERPRISE
// Falls back to placeholder values for local development.
function getStripePriceId(plan: string): string {
  return process.env[`STRIPE_PRICE_${plan.toUpperCase()}`] || `price_${plan}_monthly`;
}

export const STRIPE_PRICE_IDS: Record<string, PlanTier> = {
  [getStripePriceId('growth')]: 'growth',
  [getStripePriceId('professional')]: 'professional',
  [getStripePriceId('enterprise')]: 'enterprise',
};

export const PLAN_TO_STRIPE_PRICE: Partial<Record<PlanTier, string>> = {
  growth: getStripePriceId('growth'),
  professional: getStripePriceId('professional'),
  enterprise: getStripePriceId('enterprise'),
};

// Plan ordering for feature-gate comparisons (higher index = more features)
export const PLAN_ORDER: PlanTier[] = ['starter', 'growth', 'professional', 'enterprise'];

export interface PlanConfig {
  name: string;
  price: number;
  maxProperties: number;
  maxUnits: number;
  maxMessages: number;
  features: string[];
}

export const SMS_TEMPLATES = {
  rentReminder: (tenantName: string, amount: number, dueDate: string) =>
    `Hi ${tenantName}, this is a friendly reminder that your rent of $${amount.toFixed(2)} is due on ${dueDate}. Please let us know if you have any questions.`,

  rentOverdue: (tenantName: string, amount: number, daysPastDue: number) =>
    `Hi ${tenantName}, your rent payment of $${amount.toFixed(2)} is ${daysPastDue} day(s) past due. Please submit payment as soon as possible or contact us to discuss options.`,

  workOrderCreated: (tenantName: string, title: string) =>
    `Hi ${tenantName}, we've received your maintenance request: "${title}". We'll get back to you shortly with next steps.`,

  workOrderAssigned: (tenantName: string, title: string, vendorName: string) =>
    `Hi ${tenantName}, your maintenance request "${title}" has been assigned to ${vendorName}. They will be in touch to schedule.`,

  workOrderCompleted: (tenantName: string, title: string) =>
    `Hi ${tenantName}, your maintenance request "${title}" has been marked as completed. Please let us know if the issue is fully resolved.`,

  welcomeTenant: (tenantName: string, orgName: string) =>
    `Welcome, ${tenantName}! You can now text this number anytime for maintenance requests, questions about your lease, or other property-related needs. We're here to help! - ${orgName}`,

  afterHours: (orgName: string) =>
    `Thank you for reaching out. ${orgName} office hours are currently closed. If this is an emergency (fire, flood, gas leak), please reply with EMERGENCY. Otherwise, we'll respond during business hours.`,

  escalation: (tenantName: string) =>
    `Hi ${tenantName}, I'm connecting you with a member of our team who can better assist you. They'll be in touch shortly.`,

  vendorDispatch: (orgName: string, title: string, address: string, unitNumber: string, priority: string, description: string) =>
    `New work order from ${orgName}: ${title}\nProperty: ${address}, Unit ${unitNumber}\nPriority: ${priority}\nDescription: ${description}\n\nReply YES to accept, NO to decline.`,

  vendorAcceptedTenantNotify: (tenantName: string, vendorName: string, title: string) =>
    `Good news, ${tenantName}! ${vendorName} has been assigned to your maintenance request: "${title}". They'll be in touch to schedule.`,

  vendorDeclinedPmNotify: (vendorName: string, title: string, category: string) =>
    `Vendor ${vendorName} declined work order "${title}". No more vendors available for ${category}.`,

  vendorEscalationTimeout: (vendorName: string, title: string) =>
    `Vendor ${vendorName} did not respond to work order "${title}" within 2 hours. Auto-escalating.`,

  vendorSchedulePrompt: (title: string) =>
    `Great! When can you schedule the visit for "${title}"? Reply with your proposed date and time (e.g., "Tuesday 2pm" or "March 5 at 10am").`,

  vendorScheduleConfirm: (title: string, scheduledDate: string) =>
    `Confirmed! You're scheduled for "${title}" on ${scheduledDate}. Please contact the tenant at the time of visit.`,

  tenantScheduleNotify: (tenantName: string, title: string, vendorName: string, scheduledDate: string) =>
    `Hi ${tenantName}, ${vendorName} is scheduled to address "${title}" on ${scheduledDate}. Please ensure access to the unit. Reply if you need to reschedule.`,

  workOrderScheduled: (tenantName: string, title: string, scheduledDate: string) =>
    `Hi ${tenantName}, your maintenance request "${title}" has been scheduled for ${scheduledDate}. We'll send a reminder beforehand.`,

  optOutConfirmation: () =>
    'You have been unsubscribed from PropWise messages. Text START to re-subscribe.',

  optInConfirmation: () =>
    'You have been re-subscribed to PropWise messages.',

  unknownTenantGreeting: () =>
    "Hi! I don't have your number on file yet. Please reply with your full name and unit number (e.g., 'John Smith, Unit 4B') and I'll get you set up.",

  unknownTenantNoMatch: () =>
    "I couldn't find that unit. Your property manager has been notified and will get back to you soon.",

  rateLimitExceeded: () =>
    "You've sent a lot of messages recently. Please wait a bit before texting again, or text HELP to speak with a human.",

  tenantCompletionFollowUp: (tenantName: string, title: string) =>
    `Hi ${tenantName}, just checking in — was the issue "${title}" fully resolved? Reply YES if all good, or let us know if there's still a problem.`,
};

export const SMS_OPT_OUT_KEYWORDS = ['stop', 'unsubscribe', 'cancel', 'end', 'quit'];

export const SMS_OPT_IN_KEYWORDS = ['start', 'subscribe'];

export const COLLECTIONS = {
  organizations: 'organizations',
  properties: 'properties',
  units: 'units',
  tenants: 'tenants',
  conversations: 'conversations',
  messages: 'messages',
  workOrders: 'workOrders',
  vendors: 'vendors',
  knowledgeBase: 'knowledgeBase',
  users: 'users',
  unknownMessages: 'unknownMessages',
} as const;
