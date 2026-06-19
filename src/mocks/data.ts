/**
 * MOCK DATA — used when VITE_LOCAL=true
 * All API calls return this data instead of hitting the real API.
 */

import type { UserProfile } from '@/types/user';
import type { ResultsResponse } from '@/types/results';
import type { HealthZonesResponse } from '@/types/healthZones';
import type { AppointmentsResponse } from '@/types/appointments';
import type { FacilitiesResponse } from '@/types/facilities';
import type { BioAgeData, BioAgeHistory } from '@/types/bioAge';
import type { BffActionsResponse } from '@/types/actions';
import type { HealthProfileQuestionsResponse, UserHealthProfileResponse } from '@/types/healthProfile';
import type { BiomarkerDetailResponse } from '@/types/biomarkerDetail';
import type { PackagesResponse } from '@/types/packages';

// ─── USER ──────────────────────────────────────────────────────────────────

export const MOCK_USER: UserProfile = {
  id: 'mock-user-001',
  auth0uuidEmail: null,
  email: 'henrik@aware.app',
  auth0uuidSms: null,
  mobileNumber: null,
  stripeCustomerId: null,
  deviceId: null,
  givenName: 'Henrik',
  familyName: 'Siemers',
  sex: 'MALE',
  dateOfBirth: '1990-05-15',
  language: 'DE',
  signUpMethod: 'EMAIL',
  hasPerformedScan: true,
  termsAndConditions: '1.0',
  privacyPolicy: '1.0',
  subscribedToNewsletter: true,
  trackingOptIn: true,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2025-03-01T12:00:00Z',
  featureProfileId: 'fp-001',
  privateFolder: null,
  profilePicture: null,
  fcmToken: null,
  promotionCode: null,
  markedForDeletion: false,
  markedForDeletionAt: null,
  origin: 'web',
  workerJobId: null,
  preferredFacilityId: 'facility-berlin-mitte',
  preferredCurrency: 'EUR',
  featureProfile: {
    id: 'fp-001',
    name: 'default',
    features: ['biomarkers', 'health-zones', 'actions', 'companion'],
    defaultForNewUsers: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  activeMembershipInfo: {
    isMember: true,
    subscriptionEndDate: '2026-12-31T23:59:59Z',
    credits: [
      {
        id: 'credit-001',
        type: 'SERVICE',
        serviceName: 'Blood Test',
        subscriptionId: 'sub-001',
        packageCode: 'MH',
        max: 4,
        used: 1,
        name: 'Male Hormone Panel',
      },
    ],
  },
  features: ['biomarkers', 'health-zones', 'actions', 'companion'],
  hasFcmToken: false,
  subtitle: 'Pro Member',
  avatarUrl: null,
};

// ─── RESULTS ───────────────────────────────────────────────────────────────

export const MOCK_RESULTS: ResultsResponse = {
  hasNewResult: true,
  results: [
    {
      id: 'result-001',
      date: '2025-03-15T09:00:00Z',
      notes: null,
      inRange: 18,
      outOfRange: 5,
      biomarkers: [
        {
          id: 'bm-001',
          name: 'Vitamin D',
          code: 'VD',
          value: 42.5,
          valueText: '42.5',
          range: [30, 100],
          rangeTernary: 0,
          unit: 'nmol/L',
          biomarkerIcon: null,
          biomarkerStatus: 'NORMAL',
          optimalRange: [75, 100],
          rangeOptimalTernary: -1,
          rangeType: null,
          percentageVariation: null,
        },
        {
          id: 'bm-002',
          name: 'Testosterone',
          code: 'TESTO',
          value: 18.2,
          valueText: '18.2',
          range: [10, 35],
          rangeTernary: 0,
          unit: 'nmol/L',
          biomarkerIcon: null,
          biomarkerStatus: 'OPTIMAL',
          optimalRange: [15, 30],
          rangeOptimalTernary: 0,
          rangeType: null,
          percentageVariation: 12,
        },
        {
          id: 'bm-003',
          name: 'Ferritin',
          code: 'FERR',
          value: 8.2,
          valueText: '8.2',
          range: [12, 300],
          rangeTernary: -1,
          unit: 'µg/L',
          biomarkerIcon: null,
          biomarkerStatus: 'LOW',
          optimalRange: [50, 200],
          rangeOptimalTernary: -1,
          rangeType: null,
          percentageVariation: -35,
        },
        {
          id: 'bm-004',
          name: 'CRP (hs)',
          code: 'CRP',
          value: 0.4,
          valueText: '0.4',
          range: [0, 1],
          rangeTernary: 0,
          unit: 'mg/L',
          biomarkerIcon: null,
          biomarkerStatus: 'OPTIMAL',
          optimalRange: [0, 0.5],
          rangeOptimalTernary: 0,
          rangeType: null,
          percentageVariation: null,
        },
        {
          id: 'bm-005',
          name: 'TSH',
          code: 'TSH',
          value: 2.1,
          valueText: '2.1',
          range: [0.4, 4.0],
          rangeTernary: 0,
          unit: 'mU/L',
          biomarkerIcon: null,
          biomarkerStatus: 'OPTIMAL',
          optimalRange: [1.0, 2.5],
          rangeOptimalTernary: 0,
          rangeType: null,
          percentageVariation: null,
        },
        {
          id: 'bm-006',
          name: 'LDL-Cholesterol',
          code: 'LDL',
          value: 3.8,
          valueText: '3.8',
          range: [0, 3.0],
          rangeTernary: 1,
          unit: 'mmol/L',
          biomarkerIcon: null,
          biomarkerStatus: 'HIGH',
          optimalRange: [0, 2.5],
          rangeOptimalTernary: 1,
          rangeType: null,
          percentageVariation: 8,
        },
      ],
      healthZones: [
        { id: 'hz-hormones', name: 'Hormones', icon: null, inRange: 3, outOfRange: 1 },
        { id: 'hz-metabolism', name: 'Metabolism', icon: null, inRange: 5, outOfRange: 1 },
        { id: 'hz-heart', name: 'Heart', icon: null, inRange: 2, outOfRange: 1 },
        { id: 'hz-immunity', name: 'Immunity', icon: null, inRange: 4, outOfRange: 0 },
        { id: 'hz-energy', name: 'Energy', icon: null, inRange: 2, outOfRange: 1 },
        { id: 'hz-nutrients', name: 'Nutrients', icon: null, inRange: 2, outOfRange: 1 },
      ],
      knownBiomarkers: [],
      seenAt: null,
      bookedPackageCodes: ['MH'],
      type: 'LAB',
      unsupportedBiomarkers: 0,
    },
    {
      id: 'result-002',
      date: '2024-10-01T09:00:00Z',
      notes: null,
      inRange: 15,
      outOfRange: 7,
      biomarkers: [
        {
          id: 'bm-old-001',
          name: 'Vitamin D',
          code: 'VD',
          value: 28.0,
          valueText: '28.0',
          range: [30, 100],
          rangeTernary: -1,
          unit: 'nmol/L',
          biomarkerIcon: null,
          biomarkerStatus: 'LOW',
          optimalRange: [75, 100],
          rangeOptimalTernary: -1,
          rangeType: null,
          percentageVariation: null,
        },
        {
          id: 'bm-old-002',
          name: 'Testosterone',
          code: 'TESTO',
          value: 15.8,
          valueText: '15.8',
          range: [10, 35],
          rangeTernary: 0,
          unit: 'nmol/L',
          biomarkerIcon: null,
          biomarkerStatus: 'NORMAL',
          optimalRange: [15, 30],
          rangeOptimalTernary: 0,
          rangeType: null,
          percentageVariation: null,
        },
      ],
      healthZones: [
        { id: 'hz-hormones', name: 'Hormones', icon: null, inRange: 2, outOfRange: 2 },
        { id: 'hz-metabolism', name: 'Metabolism', icon: null, inRange: 4, outOfRange: 2 },
      ],
      knownBiomarkers: [],
      seenAt: '2024-10-02T10:00:00Z',
      bookedPackageCodes: ['MH'],
      type: 'LAB',
      unsupportedBiomarkers: 0,
    },
  ],
  packages: [
    {
      packageName: 'Male Hormone Panel',
      packageDescription: 'Comprehensive male hormone analysis',
      packageCode: 'MH',
      packageOrder: 1,
      isAddOn: false,
      marketingPrice: '€79',
      marketingMessage: 'Most popular',
    },
  ],
};

// ─── HEALTH ZONES ──────────────────────────────────────────────────────────

export const MOCK_HEALTH_ZONES: HealthZonesResponse = {
  healthZones: [
    {
      id: 'hz-hormones',
      name: 'Hormones',
      icon: null,
      about: { description: 'Your hormonal balance affects energy, mood, and metabolism.', title: 'About Hormones', image: null, url: null },
      description: 'Hormonal balance is key to overall health.',
      knownBiomarkers: [
        { code: 'TESTO', name: 'Testosterone', unit: 'nmol/L', biomarkerIcon: null },
        { code: 'TSH', name: 'TSH', unit: 'mU/L', biomarkerIcon: null },
      ],
      healthTip: null,
      relatedArticles: [],
    },
    {
      id: 'hz-metabolism',
      name: 'Metabolism',
      icon: null,
      about: { description: 'Metabolism governs how your body converts food to energy.', title: 'About Metabolism', image: null, url: null },
      description: 'Metabolic health underpins energy and weight management.',
      knownBiomarkers: [
        { code: 'GLU', name: 'Glucose', unit: 'mmol/L', biomarkerIcon: null },
        { code: 'HBA1C', name: 'HbA1c', unit: '%', biomarkerIcon: null },
      ],
      healthTip: null,
      relatedArticles: [],
    },
    {
      id: 'hz-heart',
      name: 'Heart',
      icon: null,
      about: { description: 'Cardiovascular markers reveal your heart health risk.', title: 'About Heart', image: null, url: null },
      description: 'Heart health is central to longevity.',
      knownBiomarkers: [
        { code: 'LDL', name: 'LDL-Cholesterol', unit: 'mmol/L', biomarkerIcon: null },
        { code: 'HDL', name: 'HDL-Cholesterol', unit: 'mmol/L', biomarkerIcon: null },
      ],
      healthTip: null,
      relatedArticles: [],
    },
    {
      id: 'hz-immunity',
      name: 'Immunity',
      icon: null,
      about: { description: 'Immune markers reflect your ability to fight infection and inflammation.', title: 'About Immunity', image: null, url: null },
      description: 'Immune health protects against disease.',
      knownBiomarkers: [
        { code: 'CRP', name: 'CRP', unit: 'mg/L', biomarkerIcon: null },
        { code: 'WBC', name: 'White Blood Cells', unit: '×10⁹/L', biomarkerIcon: null },
      ],
      healthTip: null,
      relatedArticles: [],
    },
    {
      id: 'hz-energy',
      name: 'Energy',
      icon: null,
      about: { description: 'Energy markers show how well your cells produce and use energy.', title: 'About Energy', image: null, url: null },
      description: 'Fatigue and vitality start in your blood.',
      knownBiomarkers: [
        { code: 'FERR', name: 'Ferritin', unit: 'µg/L', biomarkerIcon: null },
        { code: 'B12', name: 'Vitamin B12', unit: 'pmol/L', biomarkerIcon: null },
      ],
      healthTip: null,
      relatedArticles: [],
    },
    {
      id: 'hz-nutrients',
      name: 'Nutrients',
      icon: null,
      about: { description: 'Vitamin and mineral levels reveal nutritional deficiencies.', title: 'About Nutrients', image: null, url: null },
      description: 'Nutritional sufficiency is the foundation of wellbeing.',
      knownBiomarkers: [
        { code: 'VD', name: 'Vitamin D', unit: 'nmol/L', biomarkerIcon: null },
        { code: 'MG', name: 'Magnesium', unit: 'mmol/L', biomarkerIcon: null },
      ],
      healthTip: null,
      relatedArticles: [],
    },
  ],
};

// ─── BIO AGE ───────────────────────────────────────────────────────────────

export const MOCK_BIO_AGE: BioAgeData = {
  bioAge: {
    resultId: 'result-001',
    yearsOld: 35,
    ageAtBloodDraw: 35,
    bioAge: 31,
    ageAcceleration: -4,
    ageAccelerationPercentage: -11.4,
    dateOfBloodDraw: '2025-03-15T09:00:00Z',
    breakDown: {
      inflammation: -2,
      metabolism: -1,
      hormones: -1,
    },
  },
};

export const MOCK_BIO_AGE_HISTORY: BioAgeHistory = {
  bioAgeProgress: [
    {
      resultId: 'result-002',
      yearsOld: 34,
      ageAtBloodDraw: 34,
      bioAge: 33,
      ageAcceleration: -1,
      ageAccelerationPercentage: -2.9,
      dateOfBloodDraw: '2024-10-01T09:00:00Z',
      breakDown: { inflammation: -1, metabolism: 0, hormones: 0 },
    },
    {
      resultId: 'result-001',
      yearsOld: 35,
      ageAtBloodDraw: 35,
      bioAge: 31,
      ageAcceleration: -4,
      ageAccelerationPercentage: -11.4,
      dateOfBloodDraw: '2025-03-15T09:00:00Z',
      breakDown: { inflammation: -2, metabolism: -1, hormones: -1 },
    },
  ],
};

// ─── ACTIONS ───────────────────────────────────────────────────────────────

export const MOCK_ACTIONS: BffActionsResponse = {
  categories: [
    {
      id: 'diets',
      name: 'Diets',
      actions: [
        {
          code: 'mediterranean-diet',
          category: 'diets',
          title: 'Mediterranean Diet',
          description: 'Rich in healthy fats and antioxidants. Shown to reduce LDL cholesterol by up to 15%.',
          imageUrl: undefined,
          triggeringIndicators: [{ code: 'LDL', name: 'LDL-Cholesterol', status: 'HIGH' }],
        },
        {
          code: 'iron-rich-diet',
          category: 'diets',
          title: 'Iron-Rich Foods',
          description: 'Increase intake of red meat, legumes, and leafy greens to raise ferritin levels.',
          imageUrl: undefined,
          triggeringIndicators: [{ code: 'FERR', name: 'Ferritin', status: 'LOW' }],
        },
      ],
    },
    {
      id: 'supplements',
      name: 'Supplements',
      actions: [
        {
          code: 'vitamin-d3',
          category: 'supplements',
          title: 'Vitamin D3 + K2',
          description: 'Take 2000–4000 IU daily with a fatty meal to raise your Vitamin D levels to optimal range.',
          imageUrl: undefined,
          details: { dosage: '2000–4000 IU', timing: 'with a meal', frequency: 'daily' },
          triggeringIndicators: [{ code: 'VD', name: 'Vitamin D', status: 'NORMAL' }],
        },
        {
          code: 'iron-bisglycinate',
          category: 'supplements',
          title: 'Iron Bisglycinate',
          description: 'Gentle iron supplement, take 25mg on an empty stomach with Vitamin C for best absorption.',
          imageUrl: undefined,
          details: { dosage: '25mg', timing: 'morning, empty stomach', frequency: 'daily' },
          triggeringIndicators: [{ code: 'FERR', name: 'Ferritin', status: 'LOW' }],
        },
      ],
    },
    {
      id: 'workouts',
      name: 'Workouts',
      actions: [
        {
          code: 'zone2-cardio',
          category: 'workouts',
          title: 'Zone 2 Cardio',
          description: '3–4x per week, 45 min at low intensity (135–145 bpm). Improves metabolic health and lowers LDL.',
          imageUrl: undefined,
          details: { frequency: '3–4x per week', duration: '45 min', intensity: 'low' },
          triggeringIndicators: [{ code: 'LDL', name: 'LDL-Cholesterol', status: 'HIGH' }],
        },
      ],
    },
  ],
};

// ─── APPOINTMENTS ──────────────────────────────────────────────────────────

export const MOCK_APPOINTMENTS: AppointmentsResponse = {
  appointments: [
    {
      id: 'appt-001',
      beganAt: '2025-05-10T09:00:00Z',
      endedAt: '2025-05-10T09:30:00Z',
      checkedInAt: undefined,
      consentAt: undefined,
      status: 'SCHEDULED',
      bookedPackageCodes: ['MH'],
      facility: { id: 'facility-berlin-mitte', facilityCode: 'BER-MITTE', name: 'Berlin Mitte' },
      user: MOCK_USER,
    },
  ],
  packages: [
    {
      packageName: 'Male Hormone Panel',
      packageDescription: 'Comprehensive male hormone analysis',
      packageCode: 'MH',
      packageOrder: 1,
      isAddOn: false,
      marketingPrice: '€79',
      marketingMessage: '',
    },
  ],
  sortBy: 'date',
  sortDirection: 'ASC',
  total: 1,
};

// ─── FACILITIES ────────────────────────────────────────────────────────────

export const MOCK_FACILITIES: FacilitiesResponse = {
  facilities: [
    { id: 'facility-berlin-mitte', facilityCode: 'BER-MITTE', name: 'Berlin Mitte' },
    { id: 'facility-berlin-prenz', facilityCode: 'BER-PRENZ', name: 'Berlin Prenzlauer Berg' },
    { id: 'facility-hamburg', facilityCode: 'HAM-001', name: 'Hamburg Altona' },
    { id: 'facility-munich', facilityCode: 'MUC-001', name: 'München Maxvorstadt' },
    { id: 'facility-karlsruhe', facilityCode: 'KA-001', name: 'Karlsruhe City' },
  ],
};

// ─── HEALTH PROFILE ────────────────────────────────────────────────────────

export const MOCK_HEALTH_PROFILE_QUESTIONS: HealthProfileQuestionsResponse = [
  {
    code: 'personal',
    title: 'Personal Info',
    questions: [
      { code: 'weight', title: 'Weight', type: 'NUMBER_DECIMAL', input: { unit: 'kg', min: 30, max: 200, hint: 75 } },
      { code: 'height', title: 'Height', type: 'NUMBER_INTEGER', input: { unit: 'cm', min: 100, max: 250, hint: 175 } },
      { code: 'smoking', title: 'Do you smoke?', type: 'SELECTION_SINGLE', input: { options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] } },
    ],
  },
  {
    code: 'nutrition',
    title: 'Nutrition',
    questions: [
      { code: 'diet', title: 'Diet type', type: 'SELECTION_SINGLE', input: { options: [{ value: 'omnivore', label: 'Omnivore' }, { value: 'vegetarian', label: 'Vegetarian' }, { value: 'vegan', label: 'Vegan' }] } },
    ],
  },
  {
    code: 'lifestyle',
    title: 'Lifestyle',
    questions: [
      { code: 'exercise', title: 'Weekly exercise', type: 'SELECTION_SINGLE', input: { options: [{ value: 'none', label: 'None' }, { value: '1-2', label: '1–2x/week' }, { value: '3-5', label: '3–5x/week' }, { value: '6+', label: '6+x/week' }] } },
    ],
  },
];

export const MOCK_HEALTH_PROFILE_ANSWERS: UserHealthProfileResponse = {
  healthProfile: [
    { code: 'weight', value: 78 },
    { code: 'height', value: 182 },
    { code: 'smoking', value: 'no' },
    { code: 'diet', value: 'omnivore' },
    { code: 'exercise', value: '3-5' },
  ],
};

// ─── BIOMARKER DETAIL ──────────────────────────────────────────────────────

export const MOCK_BIOMARKER_DETAIL: BiomarkerDetailResponse = {
  id: 'bm-001',
  name: 'Vitamin D',
  code: 'VD',
  value: 42.5,
  valueText: '42.5',
  unit: 'nmol/L',
  range: [30, 100],
  rangeTernary: 0,
  optimalRange: [75, 100],
  optimalRangesInfo: null,
  rangeOptimalTernary: -1,
  biomarkerStatus: 'NORMAL',
  description: 'Vitamin D is essential for calcium absorption, immune function, and bone health.',
  summary: 'Your Vitamin D is in the normal range but below the optimal level of 75–100 nmol/L.',
  explanation: 'Insufficient sun exposure and dietary intake are the most common causes.',
  etiology: 'Most people in Northern Europe have insufficient Vitamin D during winter months.',
  outline: null,
  healthFacts: [
    { title: 'Immune support', description: 'Vitamin D modulates immune responses.', image: null, url: null },
    { title: 'Bone health', description: 'Critical for calcium metabolism and bone density.', image: null, url: null },
  ],
  articles: [],
  healthZoneIds: ['hz-nutrients', 'hz-immunity'],
  foodItems: [],
  healthHabits: [],
  disclaimer: null,
};

// ─── PACKAGES ──────────────────────────────────────────────────────────────

export const MOCK_PACKAGES: PackagesResponse = {
  packages: [
    {
      isAddOn: false,
      creditAvailable: true,
      packageDescription: 'Comprehensive male hormone analysis including testosterone, SHBG, and more.',
      packageCode: 'MH',
      packageName: 'Male Hormone Panel',
      packageOrder: 1,
      price: 7900,
      currency: 'EUR',
      knownBiomarkers: [],
      marketingPrice: '€79',
      marketingMessage: 'Most popular',
    } as unknown as import('@/types/packages').HealthPackage & { packageCode: string; packageName: string; packageOrder: number; marketingPrice: string; marketingMessage: string },
  ] as unknown as PackagesResponse['packages'],
};
