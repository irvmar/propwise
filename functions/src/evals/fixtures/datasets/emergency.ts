import { EvalCase } from '../types';
import { makeOrg } from '../contexts';

export const emergencyCases: EvalCase[] = [
  {
    id: 'emg-001',
    description: 'Flood in apartment — fast-path emergency',
    category: 'emergency',
    tags: ['fast-path'],
    input: { message: 'There is a flood in my apartment' },
    expected: {
      intent: 'emergency',
      confidenceRange: [0.95, 1.0],
      shouldEscalate: true,
      isFastPath: true,
      minResponseLength: 10,
    },
  },
  {
    id: 'emg-002',
    description: 'Gas smell — fast-path emergency',
    category: 'emergency',
    tags: ['fast-path'],
    input: { message: 'I think there is a gas leak in my kitchen' },
    expected: {
      intent: 'emergency',
      confidenceRange: [0.95, 1.0],
      shouldEscalate: true,
      isFastPath: true,
    },
  },
  {
    id: 'emg-003',
    description: 'Smoke detected — fast-path emergency',
    category: 'emergency',
    tags: ['fast-path'],
    input: { message: 'My smoke detector is going off and I see smoke' },
    expected: {
      intent: 'emergency',
      confidenceRange: [0.95, 1.0],
      shouldEscalate: true,
      isFastPath: true,
    },
  },
  {
    id: 'emg-004',
    description: 'Custom org emergency keyword (rats)',
    category: 'emergency',
    tags: ['fast-path', 'custom-keywords'],
    input: {
      message: 'There are rats everywhere in my kitchen',
      contextOverrides: {
        organization: makeOrg({
          settings: {
            aiEnabled: true,
            autoRespond: true,
            escalationEmail: 'pm@example.com',
            businessHours: {
              timezone: 'America/New_York',
              schedule: {
                monday: { enabled: true, start: '09:00', end: '17:00' },
                tuesday: { enabled: true, start: '09:00', end: '17:00' },
                wednesday: { enabled: true, start: '09:00', end: '17:00' },
                thursday: { enabled: true, start: '09:00', end: '17:00' },
                friday: { enabled: true, start: '09:00', end: '17:00' },
                saturday: { enabled: false, start: '09:00', end: '17:00' },
                sunday: { enabled: false, start: '09:00', end: '17:00' },
              },
            },
            rentReminderDaysBefore: [3, 1],
            emergencyKeywords: ['rats', 'mold'],
            defaultLanguage: 'en',
          },
        }),
      },
    },
    expected: {
      intent: 'emergency',
      confidenceRange: [0.95, 1.0],
      shouldEscalate: true,
      isFastPath: true,
    },
  },
];
