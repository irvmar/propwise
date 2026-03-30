import { EvalCase } from '../types';
import { TENANT_WITH_WORK_ORDERS } from '../contexts';

export const statusInquiryCases: EvalCase[] = [
  {
    id: 'stat-001',
    description: 'Work order status update — has active WO',
    category: 'status_inquiry',
    tags: ['work-order'],
    input: {
      message: 'Any updates on my work order?',
      contextOverrides: {
        tenant: TENANT_WITH_WORK_ORDERS.tenant,
        recentWorkOrders: TENANT_WITH_WORK_ORDERS.recentWorkOrders,
      },
    },
    expected: {
      intentOneOf: ['status_inquiry', 'general_inquiry'],
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
      minResponseLength: 10,
    },
  },
  {
    id: 'stat-002',
    description: 'Specific WO with scheduled vendor — should mention vendor or date',
    category: 'status_inquiry',
    tags: ['work-order', 'vendor'],
    input: {
      message: "What's happening with my sink repair?",
      contextOverrides: {
        tenant: TENANT_WITH_WORK_ORDERS.tenant,
        recentWorkOrders: TENANT_WITH_WORK_ORDERS.recentWorkOrders,
      },
    },
    expected: {
      intentOneOf: ['status_inquiry', 'maintenance', 'general_inquiry'],
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
      minResponseLength: 10,
    },
  },
  {
    id: 'stat-003',
    description: 'Status inquiry with no active WOs',
    category: 'status_inquiry',
    tags: ['empty-state'],
    input: {
      message: 'Any updates?',
      contextOverrides: { recentWorkOrders: [] },
    },
    expected: {
      intentOneOf: ['status_inquiry', 'general_inquiry', 'greeting'],
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
      minResponseLength: 10,
    },
  },
];
