export type AppCategory = 'Games' | 'Social' | 'Entertainment' | 'Education' | 'Utility';

export interface AppUsageItem {
  id: string;
  name: string;
  category: AppCategory;
  usageMinutesToday: number;
  timeLimitMinutes: number | null; // null = unlimited
  isBlocked: boolean;
  iconName: string;
  launchCountToday: number;
  lastUsed: string;
}

export interface GeofenceZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  alertOnEnter: boolean;
  alertOnExit: boolean;
  type: 'home' | 'school' | 'park' | 'custom';
}

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: string;
  address: string;
  speedKmh: number;
}

export interface BonusTimeRequest {
  id: string;
  childName: string;
  requestedMinutes: number;
  reason: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ActivityNotification {
  id: string;
  type: 'sos' | 'geofence' | 'battery' | 'screen_time' | 'blocked_app' | 'blocked_web' | 'auth' | 'request';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface WebCategoryRule {
  id: string;
  name: string;
  description: string;
  isBlocked: boolean;
  sampleSites: string[];
}

export interface WebDomainRule {
  id: string;
  domain: string;
  action: 'block' | 'allow';
  addedAt: string;
}

export interface ScreenTimeSchedule {
  dailyLimitMinutes: number;
  bedtimeStart: string; // e.g. "21:00"
  bedtimeEnd: string; // e.g. "07:00"
  bedtimeDowntimeEnabled: boolean;
  downtimeActiveNow: boolean;
  bonusMinutesToday: number;
}

export interface DailyCategoryUsage {
  date: string; // e.g. "Mon, Aug 31"
  dayLabel: string; // e.g. "Mon"
  Games: number;
  Entertainment: number;
  Education: number;
  Social: number;
  Utility: number;
  totalMinutes: number;
}

export interface ConsentPermissions {
  locationSharing: boolean;
  screenTimeLimits: boolean;
  appUsageMonitoring: boolean;
  webRestrictions: boolean;
  batteryDiagnostics: boolean;
  sosBroadcast: boolean;
  consentAgreedByChild: boolean;
  consentAgreedAt?: string;
}

export interface PairingDetails {
  numericCode: string; // 6-digit numeric code, e.g. "849205"
  codeExpiresAt: number; // timestamp in ms
  qrPayload: string;
  connectionState: 'unlinked' | 'pairing_in_progress' | 'consent_review' | 'connected';
  linkedAt?: string;
  parentDeviceName: string;
  consent: ConsentPermissions;
}

export interface DeviceTelemetry {
  deviceName: string;
  childName: string;
  childAge: number;
  deviceModel: string;
  osVersion: string;
  batteryPercent: number;
  isCharging: boolean;
  batteryHealth: 'Good' | 'Fair' | 'Service';
  wifiConnected: boolean;
  wifiSsid: string;
  cellularSignal: number; // 1-4 bars
  isDeviceLocked: boolean; // Instant pause from parent
  isRingAlarmActive: boolean;
  lastSyncTime: string;
  pairingCode: string;
  isAuthorized: boolean;
  authorizedAt: string;
  parentPin: string;
  currentLocation: LocationPoint;
  locationHistory: LocationPoint[];
  geofences: GeofenceZone[];
  screenTime: ScreenTimeSchedule;
  apps: AppUsageItem[];
  webCategories: WebCategoryRule[];
  webCustomRules: WebDomainRule[];
  notifications: ActivityNotification[];
  bonusRequests: BonusTimeRequest[];
  dailyUsageHistory?: DailyCategoryUsage[];
  pairingDetails?: PairingDetails;
}
