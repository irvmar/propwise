import { FirebaseTimestamp } from './organization';

export interface Property {
  id: string;
  organizationId: string;
  name: string;
  address: Address;
  type: PropertyType;
  unitCount: number;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export type PropertyType = 'single_family' | 'multi_family' | 'apartment' | 'condo' | 'townhouse' | 'commercial';

export interface Unit {
  id: string;
  propertyId: string;
  organizationId: string;
  number: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  rentAmount: number;
  rentDueDay: number; // 1-28
  status: UnitStatus;
  currentTenantId?: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

export type UnitStatus = 'occupied' | 'vacant' | 'maintenance' | 'listed';
