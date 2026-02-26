import { Timestamp } from 'firebase-admin/firestore';

// ─── Enums ──────────────────────────────────────────────────────────

export type LeadStatus = 'new' | 'nurturing' | 'hot' | 'converted' | 'unsubscribed' | 'bounced';

export type LeadSource = 'manual' | 'csv_import' | 'website' | 'biggerPockets' | 'narpm' | 'referral';

export type EmailEventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';

export type SocialPlatform = 'linkedin' | 'twitter';

export type SocialPostStatus = 'draft' | 'approved' | 'rejected' | 'published';

export type ContentTheme = 'pain_points' | 'solutions' | 'social_proof' | 'vision';

// ─── Lead ───────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  email: string;
  name: string;
  company?: string;
  portfolioSize?: number;
  market?: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  sequenceId?: string;
  sequenceStep: number;
  nextEmailAt?: Timestamp | null;
  lastEmailAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Email Sequence ─────────────────────────────────────────────────

export interface EmailSequenceStep {
  stepNumber: number;
  dayOffset: number;
  subjectTemplate: string;
  bodyTemplate: string;
  variant: string;
}

export interface EmailSequence {
  id: string;
  name: string;
  description: string;
  steps: EmailSequenceStep[];
  isDefault: boolean;
  createdAt: Timestamp;
}

// ─── Email Event ────────────────────────────────────────────────────

export interface EmailEvent {
  id: string;
  leadId: string;
  leadEmail: string;
  sequenceId: string;
  stepNumber: number;
  type: EmailEventType;
  resendEmailId?: string;
  metadata?: Record<string, string>;
  timestamp: Timestamp;
}

// ─── Social Post ────────────────────────────────────────────────────

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  theme: ContentTheme;
  dayOfWeek: string;
  campaignWeek: string;
  status: SocialPostStatus;
  imageBase64?: string | null;
  scheduledFor?: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp;
  rejectedReason?: string;
  publishedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Campaign ───────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'blog';
  status: 'active' | 'paused' | 'completed';
  startDate: Timestamp;
  endDate?: Timestamp;
  metrics: CampaignMetrics;
  createdAt: Timestamp;
}

export interface CampaignMetrics {
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  leadsGenerated: number;
  leadsConverted: number;
  socialPostsPublished: number;
  blogPostsPublished: number;
}
