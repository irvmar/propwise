import { EvalCase } from '../types';
import { TENANT_WITH_WORK_ORDERS } from '../contexts';

export const maintenanceCases: EvalCase[] = [
  {
    id: 'mnt-001',
    description: 'Clear faucet leak — should create plumbing work order',
    category: 'maintenance',
    tags: ['tool-call', 'work-order'],
    input: { message: 'My kitchen faucet is leaking under the cabinet' },
    expected: {
      intentOneOf: ['maintenance', 'general_inquiry'],
      shouldCreateWorkOrder: true,
      workOrderContains: { category: 'plumbing', priority: 'medium' },
      shouldEscalate: false,
      minResponseLength: 10,
    },
  },
  {
    id: 'mnt-002',
    description: 'Broken AC in heat — should create high-priority HVAC work order',
    category: 'maintenance',
    tags: ['tool-call', 'work-order', 'urgent'],
    input: { message: 'AC is broken its 95 degrees in here' },
    expected: {
      intentOneOf: ['maintenance', 'general_inquiry'],
      shouldCreateWorkOrder: true,
      workOrderContains: { category: 'hvac' },
      shouldEscalate: false,
    },
  },
  {
    id: 'mnt-003',
    description: 'Vague bathroom issue — should ask clarifying questions',
    category: 'maintenance',
    tags: ['clarification'],
    input: { message: 'something is wrong in my bathroom' },
    expected: {
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
      minResponseLength: 20,
    },
  },
  {
    id: 'mnt-004',
    description: 'Bedroom light out — should create electrical work order',
    category: 'maintenance',
    tags: ['tool-call', 'work-order'],
    input: { message: 'The light in my bedroom stopped working last night' },
    expected: {
      intentOneOf: ['maintenance', 'general_inquiry'],
      shouldCreateWorkOrder: true,
      workOrderContains: { category: 'electrical' },
      shouldEscalate: false,
    },
  },
  {
    id: 'mnt-005',
    description: 'Cockroaches — should create pest control work order',
    category: 'maintenance',
    tags: ['tool-call', 'work-order'],
    input: { message: 'I have cockroaches in my kitchen' },
    expected: {
      intentOneOf: ['maintenance', 'general_inquiry'],
      shouldCreateWorkOrder: true,
      workOrderContains: { category: 'pest_control' },
      shouldEscalate: false,
    },
  },
  {
    id: 'mnt-006',
    description: 'Duplicate WO prevention — tenant has active faucet WO, asks about sink',
    category: 'maintenance',
    tags: ['dedup', 'status'],
    input: {
      message: 'any news on my sink?',
      contextOverrides: {
        tenant: TENANT_WITH_WORK_ORDERS.tenant,
        recentWorkOrders: TENANT_WITH_WORK_ORDERS.recentWorkOrders,
      },
    },
    expected: {
      intentOneOf: ['status_inquiry', 'maintenance'],
      shouldCreateWorkOrder: false,
      shouldEscalate: false,
      minResponseLength: 10,
    },
  },
];
