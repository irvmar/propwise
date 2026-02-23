import { FirebaseTimestamp } from './organization';

export interface WorkOrder {
  id: string;
  organizationId: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  conversationId?: string;
  title: string;
  description: string;
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  vendorId?: string;
  assignedTo?: string;
  scheduledDate?: string; // ISO date
  completedDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  photos?: string[];
  notes: WorkOrderNote[];
  source: WorkOrderSource;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

export type WorkOrderCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'appliance'
  | 'structural'
  | 'pest_control'
  | 'landscaping'
  | 'cleaning'
  | 'painting'
  | 'flooring'
  | 'roofing'
  | 'locksmith'
  | 'general'
  | 'other';

export type WorkOrderPriority = 'emergency' | 'high' | 'medium' | 'low';

export type WorkOrderStatus =
  | 'new'
  | 'assigned'
  | 'scheduled'
  | 'in_progress'
  | 'pending_parts'
  | 'completed'
  | 'cancelled';

export type WorkOrderSource = 'sms' | 'dashboard' | 'phone' | 'email';

export interface WorkOrderNote {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: FirebaseTimestamp;
}
