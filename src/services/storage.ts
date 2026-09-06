import {
  DeviceTelemetry,
  LocationPoint,
  GeofenceZone,
  ActivityNotification,
  AppUsageItem,
  WebCategoryRule,
  WebDomainRule,
  ScreenTimeSchedule,
  PairingDetails,
  ConsentPermissions,
} from '../types';

export const generateNumericCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createPairingSession = (code?: string): PairingDetails => {
  const numericCode = code || generateNumericCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now
  const qrPayload = JSON.stringify({
    protocol: 'airdroid-parental-pair',
    version: '2.0',
    pairingCode: numericCode,
    parentHost: 'Parent Admin Hub',
    expiresAt,
    deviceFingerprint: 'PARENT-HUB-SEC-9241',
  });

  return {
    numericCode,
    codeExpiresAt: expiresAt,
    qrPayload,
    connectionState: 'connected',
    linkedAt: 'Aug 18, 2026 at 10:45 AM',
    parentDeviceName: 'Parent Admin Hub (iPhone 15 Pro)',
    consent: {
      locationSharing: true,
      screenTimeLimits: true,
      appUsageMonitoring: true,
      webRestrictions: true,
      batteryDiagnostics: true,
      sosBroadcast: true,
      consentAgreedByChild: true,
      consentAgreedAt: 'Aug 18, 2026',
    },
  };
};

const defaultPairingDetails: PairingDetails = createPairingSession('849205');

const STORAGE_KEY = 'parental_control_telemetry_v1';
const SYNC_CHANNEL_NAME = 'parental_control_sync_bus';

const defaultApps: AppUsageItem[] = [
  {
    id: 'app-youtube',
    name: 'YouTube Kids',
    category: 'Entertainment',
    usageMinutesToday: 48,
    timeLimitMinutes: 60,
    isBlocked: false,
    iconName: 'youtube',
    launchCountToday: 5,
    lastUsed: '12 minutes ago',
  },
  {
    id: 'app-roblox',
    name: 'Roblox',
    category: 'Games',
    usageMinutesToday: 55,
    timeLimitMinutes: 45,
    isBlocked: false,
    iconName: 'gamepad-2',
    launchCountToday: 3,
    lastUsed: '35 minutes ago',
  },
  {
    id: 'app-duolingo',
    name: 'Duolingo',
    category: 'Education',
    usageMinutesToday: 25,
    timeLimitMinutes: null,
    isBlocked: false,
    iconName: 'languages',
    launchCountToday: 2,
    lastUsed: '1 hour ago',
  },
  {
    id: 'app-tiktok',
    name: 'TikTok',
    category: 'Social',
    usageMinutesToday: 0,
    timeLimitMinutes: 0,
    isBlocked: true,
    iconName: 'video',
    launchCountToday: 1,
    lastUsed: 'Yesterday',
  },
  {
    id: 'app-chrome',
    name: 'Safe Chrome Browser',
    category: 'Utility',
    usageMinutesToday: 18,
    timeLimitMinutes: 40,
    isBlocked: false,
    iconName: 'globe',
    launchCountToday: 4,
    lastUsed: 'Just now',
  },
  {
    id: 'app-minecraft',
    name: 'Minecraft',
    category: 'Games',
    usageMinutesToday: 30,
    timeLimitMinutes: 60,
    isBlocked: false,
    iconName: 'box',
    launchCountToday: 1,
    lastUsed: '3 hours ago',
  },
  {
    id: 'app-spotify',
    name: 'Spotify Kids',
    category: 'Entertainment',
    usageMinutesToday: 20,
    timeLimitMinutes: null,
    isBlocked: false,
    iconName: 'headphones',
    launchCountToday: 2,
    lastUsed: '4 hours ago',
  },
];

const defaultGeofences: GeofenceZone[] = [
  {
    id: 'geo-1',
    name: 'Home (Safe Zone)',
    lat: 37.7749,
    lng: -122.4194,
    radiusMeters: 180,
    alertOnEnter: true,
    alertOnExit: true,
    type: 'home',
  },
  {
    id: 'geo-2',
    name: 'Oak Ridge Elementary School',
    lat: 37.7812,
    lng: -122.411,
    radiusMeters: 250,
    alertOnEnter: true,
    alertOnExit: true,
    type: 'school',
  },
  {
    id: 'geo-3',
    name: 'Lincoln Community Park',
    lat: 37.7685,
    lng: -122.428,
    radiusMeters: 200,
    alertOnEnter: false,
    alertOnExit: true,
    type: 'park',
  },
];

const defaultWebCategories: WebCategoryRule[] = [
  {
    id: 'cat-adult',
    name: 'Adult & Explicit Content',
    description: 'Enforces SafeSearch and filters pornographic, age-inappropriate websites',
    isBlocked: true,
    sampleSites: ['adult-sites.com', 'maturecontent.net'],
  },
  {
    id: 'cat-gambling',
    name: 'Gambling & Betting',
    description: 'Blocks casinos, lotteries, and betting platforms',
    isBlocked: true,
    sampleSites: ['onlinecasino.com', 'betting-portal.org'],
  },
  {
    id: 'cat-violence',
    name: 'Violence & Weapons',
    description: 'Filters graphic violence, weapon trading, and illegal substances',
    isBlocked: true,
    sampleSites: ['weapons-store.biz', 'violent-media.org'],
  },
  {
    id: 'cat-social',
    name: 'Unrestricted Social Networks',
    description: 'Restricts open social media with unmoderated direct messaging',
    isBlocked: true,
    sampleSites: ['chat-roulette-clone.com', 'unfiltered-forum.io'],
  },
  {
    id: 'cat-phishing',
    name: 'Malware & Phishing Protection',
    description: 'Blocks deceptive links, scam downloads, and dangerous domains',
    isBlocked: true,
    sampleSites: ['free-robux-hack.xyz', 'login-verify-fake.info'],
  },
];

const defaultCustomWebRules: WebDomainRule[] = [
  { id: 'rule-1', domain: 'discord.com', action: 'block', addedAt: '2 days ago' },
  { id: 'rule-2', domain: 'omegle.com', action: 'block', addedAt: '3 days ago' },
  { id: 'rule-3', domain: 'khanacademy.org', action: 'allow', addedAt: '1 week ago' },
  { id: 'rule-4', domain: 'scratch.mit.edu', action: 'allow', addedAt: '1 week ago' },
];

const default7DayUsage = [
  { date: 'Aug 31', dayLabel: 'Mon', Games: 45, Entertainment: 40, Education: 30, Social: 0, Utility: 15, totalMinutes: 130 },
  { date: 'Sep 01', dayLabel: 'Tue', Games: 30, Entertainment: 35, Education: 45, Social: 0, Utility: 20, totalMinutes: 130 },
  { date: 'Sep 02', dayLabel: 'Wed', Games: 50, Entertainment: 45, Education: 25, Social: 10, Utility: 15, totalMinutes: 145 },
  { date: 'Sep 03', dayLabel: 'Thu', Games: 35, Entertainment: 50, Education: 35, Social: 0, Utility: 18, totalMinutes: 138 },
  { date: 'Sep 04', dayLabel: 'Fri', Games: 70, Entertainment: 60, Education: 20, Social: 15, Utility: 22, totalMinutes: 187 },
  { date: 'Sep 05', dayLabel: 'Sat', Games: 85, Entertainment: 75, Education: 15, Social: 20, Utility: 25, totalMinutes: 220 },
  { date: 'Today', dayLabel: 'Sun (Today)', Games: 85, Entertainment: 68, Education: 25, Social: 0, Utility: 18, totalMinutes: 196 },
];

const initialTelemetry: DeviceTelemetry = {
  deviceName: "Leo's Phone",
  childName: 'Leo Miller',
  childAge: 11,
  deviceModel: 'Google Pixel 8 (Android 14)',
  osVersion: 'Android 14 / Security Patch Aug 2026',
  batteryPercent: 74,
  isCharging: false,
  batteryHealth: 'Good',
  wifiConnected: true,
  wifiSsid: 'Miller_Family_5G',
  cellularSignal: 4,
  isDeviceLocked: false,
  isRingAlarmActive: false,
  lastSyncTime: 'Just now',
  pairingCode: '849205',
  isAuthorized: true,
  authorizedAt: 'Mutual Consent signed Aug 18, 2026',
  parentPin: '1234',
  pairingDetails: defaultPairingDetails,
  currentLocation: {
    lat: 37.7749,
    lng: -122.4194,
    timestamp: '2 min ago',
    address: 'Near 420 Market St, San Francisco, CA (Home)',
    speedKmh: 0,
  },
  locationHistory: [
    { lat: 37.7812, lng: -122.411, timestamp: '14:30', address: 'Oak Ridge Elementary School', speedKmh: 0 },
    { lat: 37.778, lng: -122.415, timestamp: '15:10', address: 'Market & 6th St (Transit)', speedKmh: 18 },
    { lat: 37.7749, lng: -122.4194, timestamp: '15:35', address: '420 Market St (Home)', speedKmh: 0 },
  ],
  geofences: defaultGeofences,
  screenTime: {
    dailyLimitMinutes: 150, // 2h 30m
    bedtimeStart: '20:30',
    bedtimeEnd: '06:45',
    bedtimeDowntimeEnabled: true,
    downtimeActiveNow: false,
    bonusMinutesToday: 0,
  },
  apps: defaultApps,
  webCategories: defaultWebCategories,
  webCustomRules: defaultCustomWebRules,
  notifications: [
    {
      id: 'notif-1',
      type: 'geofence',
      severity: 'info',
      title: 'Entered Safe Zone',
      message: "Leo arrived at 'Home (Safe Zone)' at 3:35 PM.",
      timestamp: '25 min ago',
      read: false,
    },
    {
      id: 'notif-2',
      type: 'screen_time',
      severity: 'warning',
      title: 'App Limit Exceeded',
      message: 'Roblox reached the 45-minute daily limit. App is paused.',
      timestamp: '48 min ago',
      read: false,
    },
    {
      id: 'notif-3',
      type: 'battery',
      severity: 'info',
      title: 'Battery Health Status',
      message: "Device battery is currently at 74% (discharging).",
      timestamp: '1 hour ago',
      read: true,
    },
    {
      id: 'notif-4',
      type: 'auth',
      severity: 'info',
      title: 'Mutual Authorization Active',
      message: 'Both parent and child confirmed device access policies with end-to-end PIN encryption.',
      timestamp: 'Yesterday',
      read: true,
    },
  ],
  bonusRequests: [
    {
      id: 'req-1',
      childName: 'Leo',
      requestedMinutes: 20,
      reason: 'Need 20 more minutes to finish science assignment on Duolingo',
      requestedAt: '10 min ago',
      status: 'pending',
    },
  ],
  dailyUsageHistory: default7DayUsage,
};

let syncBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncBroadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch {
  // broadcast channel not available
}

export function loadTelemetry(): DeviceTelemetry {
  if (typeof window === 'undefined') return initialTelemetry;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTelemetry));
      return initialTelemetry;
    }
    const parsed = JSON.parse(raw);
    const existingPairing = parsed.pairingDetails || defaultPairingDetails;
    // ensure numeric pairing code
    const numericPairingCode = existingPairing.numericCode && /^\d{6}$/.test(existingPairing.numericCode)
      ? existingPairing.numericCode
      : '849205';

    return {
      ...initialTelemetry,
      ...parsed,
      pairingCode: numericPairingCode,
      pairingDetails: {
        ...defaultPairingDetails,
        ...existingPairing,
        numericCode: numericPairingCode,
      },
      dailyUsageHistory: parsed.dailyUsageHistory && parsed.dailyUsageHistory.length > 0
        ? parsed.dailyUsageHistory
        : default7DayUsage,
    };
  } catch (err) {
    console.error('Failed to load telemetry:', err);
    return initialTelemetry;
  }
}

export function saveTelemetry(telemetry: DeviceTelemetry): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = {
      ...telemetry,
      lastSyncTime: 'Just now',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (syncBroadcastChannel) {
      syncBroadcastChannel.postMessage({ type: 'TELEMETRY_UPDATED', payload: updated });
    }
  } catch (err) {
    console.error('Failed to save telemetry:', err);
  }
}

export function subscribeToTelemetry(callback: (data: DeviceTelemetry) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        callback(JSON.parse(event.newValue));
      } catch (e) {
        console.error('Failed to parse storage update', e);
      }
    }
  };

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'TELEMETRY_UPDATED' && event.data.payload) {
      callback(event.data.payload);
    }
  };

  window.addEventListener('storage', handleStorage);
  if (syncBroadcastChannel) {
    syncBroadcastChannel.addEventListener('message', handleBroadcast);
  }

  return () => {
    window.removeEventListener('storage', handleStorage);
    if (syncBroadcastChannel) {
      syncBroadcastChannel.removeEventListener('message', handleBroadcast);
    }
  };
}

export function resetTelemetry(): DeviceTelemetry {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTelemetry));
    if (syncBroadcastChannel) {
      syncBroadcastChannel.postMessage({ type: 'TELEMETRY_UPDATED', payload: initialTelemetry });
    }
  }
  return initialTelemetry;
}
