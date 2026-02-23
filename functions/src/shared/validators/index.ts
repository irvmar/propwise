import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g., +15551234567)');

export const emailSchema = z.string().email('Invalid email address');

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  escalationEmail: emailSchema,
  escalationPhone: phoneSchema.optional(),
});

export const createPropertySchema = z.object({
  name: z.string().min(1).max(200),
  address: z.object({
    street: z.string().min(1),
    unit: z.string().optional(),
    city: z.string().min(1),
    state: z.string().length(2),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
    country: z.string().default('US'),
  }),
  type: z.enum(['single_family', 'multi_family', 'apartment', 'condo', 'townhouse', 'commercial']),
});

export const createUnitSchema = z.object({
  propertyId: z.string().min(1),
  number: z.string().min(1).max(20),
  floor: z.number().int().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  sqft: z.number().int().min(0).optional(),
  rentAmount: z.number().min(0),
  rentDueDay: z.number().int().min(1).max(28),
});

export const createTenantSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: phoneSchema,
  email: emailSchema.optional(),
  leaseStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  leaseEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rentAmount: z.number().min(0),
});

export const createVendorSchema = z.object({
  name: z.string().min(1).max(200),
  company: z.string().optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  specialties: z.array(z.enum([
    'plumbing', 'electrical', 'hvac', 'appliance', 'structural',
    'pest_control', 'landscaping', 'cleaning', 'painting',
    'flooring', 'roofing', 'locksmith', 'general', 'other',
  ])).min(1),
  hourlyRate: z.number().min(0).optional(),
  isPreferred: z.boolean().default(false),
  notes: z.string().optional(),
});

export const createKnowledgeBaseSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  category: z.enum([
    'policies', 'faq', 'maintenance', 'lease',
    'amenities', 'community', 'emergency', 'payments', 'other',
  ]),
  isActive: z.boolean().default(true),
});

export const updateWorkOrderSchema = z.object({
  workOrderId: z.string().min(1),
  status: z.enum([
    'new', 'vendor_contacted', 'assigned', 'scheduled', 'in_progress',
    'pending_parts', 'completed', 'cancelled', 'escalated',
  ]).optional(),
  vendorId: z.string().optional(),
  assignedTo: z.string().optional(),
  scheduledDate: z.string().optional(),
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
  note: z.string().optional(),
});

export const sendManualSmsSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1).max(1600),
});

// ─── Update Schemas ──────────────────────────────────────────────────

export const updatePropertySchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  address: z.object({
    street: z.string().min(1),
    unit: z.string().optional(),
    city: z.string().min(1),
    state: z.string().length(2),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
    country: z.string().default('US'),
  }).optional(),
  type: z.enum(['single_family', 'multi_family', 'apartment', 'condo', 'townhouse', 'commercial']).optional(),
});

export const updateUnitSchema = z.object({
  unitId: z.string().min(1),
  number: z.string().min(1).max(20).optional(),
  floor: z.number().int().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  sqft: z.number().int().min(0).optional(),
  rentAmount: z.number().min(0).optional(),
  rentDueDay: z.number().int().min(1).max(28).optional(),
});

export const updateTenantSchema = z.object({
  tenantId: z.string().min(1),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  leaseStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  leaseEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  rentAmount: z.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'past']).optional(),
});

export const updateVendorSchema = z.object({
  vendorId: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  company: z.string().optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  specialties: z.array(z.enum([
    'plumbing', 'electrical', 'hvac', 'appliance', 'structural',
    'pest_control', 'landscaping', 'cleaning', 'painting',
    'flooring', 'roofing', 'locksmith', 'general', 'other',
  ])).min(1).optional(),
  hourlyRate: z.number().min(0).optional(),
  isPreferred: z.boolean().optional(),
  notes: z.string().optional(),
});

export const updateKnowledgeBaseSchema = z.object({
  entryId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  category: z.enum([
    'policies', 'faq', 'maintenance', 'lease',
    'amenities', 'community', 'emergency', 'payments', 'other',
  ]).optional(),
  isActive: z.boolean().optional(),
});

export const deleteEntitySchema = z.object({
  id: z.string().min(1),
});

export const archiveConversationSchema = z.object({
  conversationId: z.string().min(1),
  status: z.enum(['resolved', 'active']),
});
