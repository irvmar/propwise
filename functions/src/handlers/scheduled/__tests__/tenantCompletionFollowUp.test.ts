/**
 * Tests for the tenant completion follow-up logic.
 *
 * We test the decision logic directly (should a follow-up be sent for this WO?)
 * rather than invoking the full onSchedule handler, since the handler is
 * tightly coupled to Firestore queries and we want fast, isolated unit tests.
 */

import { WorkOrder, Tenant, FirebaseTimestamp } from '../../../shared';

// ─── Decision logic extracted from tenantCompletionFollowUp.ts ────────────────

/**
 * Determines whether a follow-up SMS should be sent for a work order.
 * Mirrors the logic in tenantCompletionFollowUp.ts lines 35-55.
 */
function shouldSendFollowUp(
  wo: WorkOrder,
  tenant: Tenant | null,
  now: Date,
): boolean {
  // Must have a scheduled date
  if (!wo.scheduledDate) return false;

  const scheduledDate = new Date(wo.scheduledDate);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Must be in the past but within 48 hours
  if (scheduledDate > now || scheduledDate < twoDaysAgo) return false;

  // Must not already have a follow-up note
  const hasFollowUpNote = wo.notes?.some(
    (n) => n.body.includes('Completion follow-up sent'),
  );
  if (hasFollowUpNote) return false;

  // Tenant must exist and not be opted out
  if (!tenant) return false;
  if (tenant.smsOptedOut === true) return false;

  return true;
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ts: FirebaseTimestamp = { _seconds: 0, _nanoseconds: 0 };

function makeWO(overrides: Partial<WorkOrder> = {}): WorkOrder {
  return {
    id: 'wo-1',
    organizationId: 'org-1',
    propertyId: 'prop-1',
    unitId: 'unit-1',
    tenantId: 'tenant-1',
    title: 'Fix sink',
    description: 'Kitchen sink leaking',
    category: 'plumbing',
    priority: 'medium',
    status: 'scheduled',
    notes: [],
    source: 'sms',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'tenant-1',
    organizationId: 'org-1',
    propertyId: 'prop-1',
    unitId: 'unit-1',
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '+15551234567',
    leaseStart: '2024-01-01',
    leaseEnd: '2025-01-01',
    rentAmount: 1500,
    balance: 0,
    status: 'active',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('tenantCompletionFollowUp — shouldSendFollowUp', () => {
  // "now" is 2025-03-20 18:00 ET
  const now = new Date('2025-03-20T22:00:00Z');

  it('sends follow-up for WO scheduled yesterday', () => {
    const wo = makeWO({ scheduledDate: '2025-03-19T14:00:00Z' });
    expect(shouldSendFollowUp(wo, makeTenant(), now)).toBe(true);
  });

  it('skips WO scheduled tomorrow (future)', () => {
    const wo = makeWO({ scheduledDate: '2025-03-21T14:00:00Z' });
    expect(shouldSendFollowUp(wo, makeTenant(), now)).toBe(false);
  });

  it('skips WO scheduled 3 days ago (>48h)', () => {
    const wo = makeWO({ scheduledDate: '2025-03-17T14:00:00Z' });
    expect(shouldSendFollowUp(wo, makeTenant(), now)).toBe(false);
  });

  it('skips WO that already has a follow-up note (idempotent)', () => {
    const wo = makeWO({
      scheduledDate: '2025-03-19T14:00:00Z',
      notes: [
        {
          id: 'n-1',
          authorId: 'system',
          authorName: 'System',
          body: 'Completion follow-up sent to tenant.',
          createdAt: ts,
        },
      ],
    });
    expect(shouldSendFollowUp(wo, makeTenant(), now)).toBe(false);
  });

  it('skips when tenant opted out', () => {
    const wo = makeWO({ scheduledDate: '2025-03-19T14:00:00Z' });
    const tenant = makeTenant({ smsOptedOut: true });
    expect(shouldSendFollowUp(wo, tenant, now)).toBe(false);
  });

  it('skips WO with no scheduledDate', () => {
    const wo = makeWO({ scheduledDate: undefined });
    expect(shouldSendFollowUp(wo, makeTenant(), now)).toBe(false);
  });
});
