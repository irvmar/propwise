// ─── Startup Validation ──────────────────────────────────────────────────────
// Warn (don't throw) about missing env vars at cold start so issues surface
// in logs immediately rather than on first request.
const REQUIRED_ENV = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'ANTHROPIC_API_KEY'];
const missingEnv = REQUIRED_ENV.filter((v) => !process.env[v]);
if (missingEnv.length > 0 && !process.env.FUNCTIONS_EMULATOR) {
  console.error(`[PropWise] Missing required environment variables: ${missingEnv.join(', ')}`);
}

// SMS Handlers
export { incomingSms } from './handlers/sms/IncomingSms';
export { smsStatusCallback } from './handlers/sms/SmsStatusCallback';

// Dashboard API
export {
  createOrganization,
  createProperty,
  createUnit,
  createTenant,
  createVendor,
  updateWorkOrder,
  getDashboardStats,
  createKnowledgeBaseEntry,
  sendManualSms,
  updateProperty,
  deleteProperty,
  updateUnit,
  deleteUnit,
  updateTenant,
  deleteTenant,
  updateVendor,
  deleteVendor,
  updateKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry,
  archiveConversation,
} from './handlers/api/dashboard';

// Billing API
export {
  createCheckoutSession,
  createBillingPortalSession,
} from './handlers/api/billing';

// Stripe Webhook
export { stripeWebhook } from './handlers/stripe/stripeWebhook';

// Scheduled Functions
export { rentReminders } from './handlers/scheduled/rentReminders';
export { followUpWorkOrders } from './handlers/scheduled/followUpWorkOrders';
export { tenantCompletionFollowUp } from './handlers/scheduled/tenantCompletionFollowUp';
export { resetMonthlyCounters } from './handlers/scheduled/resetMonthlyCounters';

// Firestore Triggers
export { onWorkOrderCreated } from './handlers/scheduled/onWorkOrderCreated';
export { onTenantCreated } from './handlers/scheduled/onTenantCreated';

// Marketing
export { addLead, importLeads, getLeads, getMarketingStats, checkMarketingAccess } from './handlers/marketing/leads';
export { seedEmailSequence } from './handlers/marketing/seedSequence';
export { processEmailDrips } from './handlers/marketing/processEmailDrips';
export { resendWebhook } from './handlers/marketing/resendWebhook';
export { unsubscribeEmail } from './handlers/marketing/unsubscribe';
export { generateWeeklyContent, triggerWeeklyContent } from './handlers/marketing/generateWeeklyContent';
export { getSocialPosts, approvePost, rejectPost, deletePost, publishApprovedPosts } from './handlers/marketing/socialPosts';
export { generateBlogDraft } from './handlers/marketing/generateBlogDraft';
export { saveBlogDraft, getBlogDrafts, updateBlogDraft, deleteBlogDraft } from './handlers/marketing/blogDrafts';
export { getMarketingSettings, updateMarketingSettings } from './handlers/marketing/settings';

// Telegram Bot
export { telegramWebhook } from './handlers/telegram/telegramWebhook';
export { telegramDailyDigest } from './handlers/telegram/dailyDigest';
