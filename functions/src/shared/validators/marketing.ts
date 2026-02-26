import { z } from 'zod';

export const addLeadSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  portfolioSize: z.number().int().min(0).optional(),
  market: z.string().max(100).optional(),
  source: z.enum(['manual', 'csv_import', 'website', 'biggerPockets', 'narpm', 'referral']).default('manual'),
});

export const importLeadsSchema = z.object({
  leads: z.array(z.object({
    email: z.string().email(),
    name: z.string().min(1).max(200),
    company: z.string().max(200).optional(),
    portfolioSize: z.number().int().min(0).optional(),
    market: z.string().max(100).optional(),
    source: z.enum(['manual', 'csv_import', 'website', 'biggerPockets', 'narpm', 'referral']).default('csv_import'),
  })).min(1).max(5000),
});

export const approvePostSchema = z.object({
  postId: z.string().min(1),
  scheduledFor: z.string().datetime().optional(),
});

export const rejectPostSchema = z.object({
  postId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

export const generateBlogDraftSchema = z.object({
  topic: z.string().min(1).max(500),
  targetKeywords: z.array(z.string()).min(1).max(10),
  angle: z.string().max(500).optional(),
  wordCount: z.number().int().min(500).max(3000).default(1200),
});

export const getMarketingStatsSchema = z.object({}).optional();
