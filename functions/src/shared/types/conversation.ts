import { FirebaseTimestamp } from './organization';

export interface Conversation {
  id: string;
  organizationId: string;
  tenantId: string;
  tenantPhone: string;
  tenantName: string;
  propertyId: string;
  unitNumber: string;
  status: ConversationStatus;
  lastMessageAt: FirebaseTimestamp;
  lastMessagePreview: string;
  unreadCount: number;
  isEscalated: boolean;
  assignedTo?: string; // userId of PM handling this
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

export type ConversationStatus = 'active' | 'resolved' | 'escalated' | 'archived';

export interface Message {
  id: string;
  conversationId: string;
  organizationId: string;
  direction: MessageDirection;
  sender: MessageSender;
  body: string;
  twilioSid?: string;
  status: MessageDeliveryStatus;
  intent?: IntentCategory;
  confidence?: number;
  agentType?: string;
  mediaUrls?: string[];
  metadata?: Record<string, unknown>;
  createdAt: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
}

export type MessageDirection = 'inbound' | 'outbound';

export type MessageSender = 'tenant' | 'ai' | 'pm';

export type MessageDeliveryStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'received';

export type IntentCategory =
  | 'maintenance'
  | 'rent_inquiry'
  | 'lease_question'
  | 'emergency'
  | 'complaint'
  | 'general_inquiry'
  | 'greeting'
  | 'status_inquiry'
  | 'unknown';
