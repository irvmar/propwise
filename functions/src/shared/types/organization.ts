export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: PlanTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentFailed?: boolean;
  twilioPhoneNumber?: string;
  settings: OrganizationSettings;
  propertyCount: number;
  unitCount: number;
  tenantCount: number;
  monthlyMessageCount: number;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

export interface OrganizationSettings {
  aiEnabled: boolean;
  autoRespond: boolean;
  escalationEmail: string;
  escalationPhone?: string;
  businessHours: BusinessHours;
  rentReminderDaysBefore: number[];
  emergencyKeywords: string[];
  defaultLanguage: string;
  autoApprovalThreshold?: number; // dollars — auto-approve maintenance under this amount
}

export interface BusinessHours {
  timezone: string;
  schedule: WeeklySchedule;
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  enabled: boolean;
  start: string; // "09:00"
  end: string;   // "17:00"
}

export type PlanTier = 'starter' | 'growth' | 'professional' | 'enterprise';

/**
 * Accepts both the serialized Firestore form ({_seconds, _nanoseconds}) and
 * the admin SDK Timestamp class (which has seconds/nanoseconds getters plus
 * toDate/toMillis helpers).
 */
export type FirebaseTimestamp = {
  _seconds: number;
  _nanoseconds: number;
  toDate?: () => Date;
  toMillis?: () => number;
} | {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
  toMillis: () => number;
};
