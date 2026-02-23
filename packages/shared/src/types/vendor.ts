import { FirebaseTimestamp } from './organization';
import { WorkOrderCategory } from './work-order';

export interface Vendor {
  id: string;
  organizationId: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  specialties: WorkOrderCategory[];
  hourlyRate?: number;
  rating?: number;
  isPreferred: boolean;
  notes?: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}
