import { FirebaseTimestamp } from './organization';

export interface Tenant {
  id: string;
  organizationId: string;
  propertyId: string;
  unitId: string;
  firstName: string;
  lastName: string;
  phone: string; // E.164 format
  email?: string;
  leaseStart: string; // ISO date
  leaseEnd: string;   // ISO date
  rentAmount: number;
  balance: number; // positive = owes money
  status: TenantStatus;
  emergencyContact?: EmergencyContact;
  notes?: string;
  smsOptedOut?: boolean;
  smsOptOutDate?: FirebaseTimestamp;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

export type TenantStatus = 'active' | 'inactive' | 'eviction' | 'past';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}
