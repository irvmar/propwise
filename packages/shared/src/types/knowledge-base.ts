import { FirebaseTimestamp } from './organization';

export interface KnowledgeBase {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  category: KnowledgeBaseCategory;
  isActive: boolean;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

export type KnowledgeBaseCategory =
  | 'policies'
  | 'faq'
  | 'maintenance'
  | 'lease'
  | 'amenities'
  | 'community'
  | 'emergency'
  | 'payments'
  | 'other';
