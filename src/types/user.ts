// User sex type
export type UserSex = 'MALE' | 'FEMALE' | 'OTHER';

// User language
export type UserLanguage = 'EN' | 'PT' | 'ES' | 'FR' | 'DE';

// Sign up method
export type SignUpMethod = 'EMAIL' | 'SMS' | 'GOOGLE' | 'APPLE';

// Credit type
export interface UserCredit {
  id: string;
  type: 'SERVICE' | 'PRODUCT';
  serviceName: string;
  subscriptionId: string;
  packageCode: string;
  max: number;
  used: number;
  name: string;
}

// Active membership info
export interface ActiveMembershipInfo {
  isMember: boolean;
  subscriptionEndDate: string;
  credits: UserCredit[];
}

// Feature profile
export interface FeatureProfile {
  id: string;
  name: string;
  features: string[];
  defaultForNewUsers: boolean;
  createdAt: string;
  updatedAt: string;
}

// User profile response from /v1/users/me
export interface UserProfile {
  id: string;
  auth0uuidEmail: string | null;
  email: string;
  auth0uuidSms: string | null;
  mobileNumber: string | null;
  stripeCustomerId: string | null;
  deviceId: string | null;
  givenName: string | null;
  familyName: string | null;
  sex: UserSex | null;
  dateOfBirth: string | null;
  language: UserLanguage;
  signUpMethod: SignUpMethod;
  hasPerformedScan: boolean;
  termsAndConditions: string | null;
  privacyPolicy: string | null;
  subscribedToNewsletter: boolean;
  trackingOptIn: boolean;
  createdAt: string;
  updatedAt: string;
  featureProfileId: string;
  privateFolder: string | null;
  profilePicture: string | null;
  fcmToken: string | null;
  promotionCode: string | null;
  markedForDeletion: boolean;
  markedForDeletionAt: string | null;
  origin: string;
  workerJobId: string | null;
  preferredFacilityId: string | null;
  preferredCurrency: string;
  featureProfile: FeatureProfile;
  activeMembershipInfo: ActiveMembershipInfo;
  features: string[];
  hasFcmToken: boolean;
  subtitle: string;
  avatarUrl: string | null;
}
