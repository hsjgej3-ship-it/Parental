import React, { useState } from 'react';
import {
  Smartphone,
  Battery,
  BatteryCharging,
  Wifi,
  Signal,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  MapPin,
  Clock,
  Shield,
  ShieldAlert,
  Globe,
  Bell,
  KeyRound,
  RefreshCw,
  Plus,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Layers,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { DeviceTelemetry, LocationPoint, GeofenceZone, ScreenTimeSchedule } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { ScreenTimeManager } from './ScreenTimeManager';
import { AppManager } from './AppManager';
import { WebRestrictions } from './WebRestrictions';
import { ActivityLog } from './ActivityLog';
import { AuthorizationModal } from './AuthorizationModal';
import { WeeklyCategoryUsageChart } from './WeeklyCategoryUsageChart';
import { ParentDeviceLinkingCard } from './ParentDeviceLinkingCard';

interface ParentDashboardProps {
  telemetry: DeviceTelemetry;
  onUpdateLocation: (point: LocationPoint) => void;
  onAddGeofence: (zone: GeofenceZone) => void;
  onRemoveGeofence: (id: string) => void;
  onUpdateSchedule: (schedule: Partial<ScreenTimeSchedule>) => void;
  onToggleDeviceLock: (locked: boolean) => void;
  onResolveBonusRequest: (requestId: string, approve: boolean, grantedMinutes?: number) => void;
  onToggleAppBlock: (appId: string) => void;
  onSetAppTimeLimit: (appId: string, limitMinutes: number | null) => void;
  onToggleWebCategory: (categoryId: string) => void;
  onAddWebCustomRule: (domain: string, action: 'block' | 'allow') => void;
  onRemoveWebCustomRule: (ruleId: string) => void;
  onMarkAllNotificationsRead: () => void;
  onClearNotificationLog: () => void;
  onUpdateParentPin: (pin: string) => void;
  onRegeneratePairingCode: () => void;
  onResetAuthorization: () => void;
  onToggleRingDevice: () => void;
  onSwitchToChildMode?: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  telemetry,
  onUpdateLocation,
  onAddGeofence,
  onRemoveGeofence,
  onUpdateSchedule,
  onToggleDeviceLock,
  onResolveBonusRequest,
  onToggleAppBlock,
  onSetAppTimeLimit,
  onToggleWebCategory,
  onAddWebCustomRule,
  onRemoveWebCustomRule,
  onMarkAllNotificationsRead,
  onClearNotificationLog,
  onUpdateParentPin,
  onRegeneratePairingCode,
  onResetAuthorization,
  onToggleRingDevice,
  onSwitchToChildMode,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'location' | 'screentime' | 'apps' | 'web' | 'activity' | 'auth'
  >('overview');

  const unreadAlertsCount = telemetry.notifications.filter((n) => !n.read).length;
  const criticalSosCount = telemetry.notifications.filter(
    (n) => n.severity === 'critical' || n.type === 'sos'
  ).length;

  const totalUsedMinutes = telemetry.apps.reduce((acc, app) => acc + app.usageMinutesToday, 0);
  const totalAllowedMinutes =
    telemetry.screenTime.dailyLimitMinutes + telemetry.screenTime.bonusMinutesToday;

  return (
    <div className="space-y-6">
      {/* Unlinked Device Warning Banner */}
      {!telemetry.isAuthorized && (
        <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">
                Child Device Not Linked — Ready to Pair
              </p>
              <p className="text-xs text-slate-600">
                {telemetry.childName}&apos;s device needs to scan the pairing QR code or enter code{' '}
                <strong className="font-mono text-slate-900">{telemetry.pairingCode}</strong> with consent.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('auth')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" /> View Pairing Code &amp; QR
            </button>
            {onSwitchToChildMode && (
              <button
                onClick={onSwitchToChildMode}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Switch to Child View
              </button>
            )}
          </div>
        </div>
      )}
      {/* Alarm Sounding Toast / Banner */}
      {telemetry.isRingAlarmActive && (
        <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Volume2 className="w-6 h-6 animate-bounce" />
            <div>
              <p className="font-bold text-sm">Ringing {telemetry.childName}&apos;s Device</p>
              <p className="text-xs text-amber-100">
                Playing loud chime on {telemetry.deviceName} at maximum volume to locate lost phone.
              </p>
            </div>
          </div>
          <button
            onClick={onToggleRingDevice}
            className="px-4 py-1.5 bg-white text-amber-900 rounded-xl font-bold text-xs shadow-xs hover:bg-amber-50 transition-colors"
          >
            Stop Alarm
          </button>
        </div>
      )}

      {/* Critical SOS Banner if SOS alert is active */}
      {criticalSosCount > 0 && (
        <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-sm">Emergency Alert Dispatched</p>
              <p className="text-xs text-rose-100">
                {telemetry.childName} pressed the Emergency SOS button from {telemetry.currentLocation.address}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('activity')}
            className="px-4 py-2 bg-white text-rose-900 rounded-xl font-bold text-xs hover:bg-rose-50 transition-colors"
          >
            View Alert Feed
          </button>
        </div>
      )}

      {/* Device Header Card & Telemetry Status */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{telemetry.deviceName}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {telemetry.childName}, Age {telemetry.childAge}
                </span>
                {telemetry.isDeviceLocked && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    Paused
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {telemetry.deviceModel} • {telemetry.osVersion} • Last synced {telemetry.lastSyncTime}
              </p>
            </div>
          </div>

          {/* Device Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleRingDevice}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                telemetry.isRingAlarmActive
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Sound loud alarm on lost phone"
            >
              {telemetry.isRingAlarmActive ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" /> Stop Ringing
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-slate-600" /> Ring Lost Device
                </>
              )}
            </button>

            <button
              onClick={() => onToggleDeviceLock(!telemetry.isDeviceLocked)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 ${
                telemetry.isDeviceLocked
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {telemetry.isDeviceLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5" /> Resume Child Access
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" /> Instant Pause Device
                </>
              )}
            </button>
          </div>
        </div>

        {/* Telemetry Micro-Pills */}
        <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Battery Status */}
          <div className="flex items-center gap-2 text-slate-700">
            {telemetry.isCharging ? (
              <BatteryCharging className="w-4 h-4 text-emerald-600" />
            ) : (
              <Battery
                className={`w-4 h-4 ${
                  telemetry.batteryPercent <= 15 ? 'text-rose-600' : 'text-blue-600'
                }`}
              />
            )}
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Battery Status</span>
              <span className="font-bold">
                {telemetry.batteryPercent}% ({telemetry.isCharging ? 'Charging' : 'Discharging'})
              </span>
            </div>
          </div>

          {/* Wi-Fi Status */}
          <div className="flex items-center gap-2 text-slate-700">
            <Wifi className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Wi-Fi Network</span>
              <span className="font-bold truncate max-w-[120px]">{telemetry.wifiSsid}</span>
            </div>
          </div>

          {/* Cellular Signal */}
          <div className="flex items-center gap-2 text-slate-700">
            <Signal className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Cellular Signal</span>
              <span className="font-bold">{telemetry.cellularSignal} / 4 Bars (5G)</span>
            </div>
          </div>

          {/* Authorization State */}
          <div className="flex items-center gap-2 text-slate-700">
            <Shield className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Pairing Security</span>
              <span className="font-bold text-emerald-700">Mutual Auth Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'location', label: 'Live Location & Geofences', icon: MapPin },
          { id: 'screentime', label: 'Screen Time & Downtime', icon: Clock },
          { id: 'apps', label: 'App Management', icon: Smartphone },
          { id: 'web', label: 'Web Filtering', icon: Globe },
          {
            id: 'activity',
            label: 'Activity Alerts',
            icon: Bell,
            badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
          },
          { id: 'auth', label: 'Device Linking & QR Code', icon: QrCode },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.badge && (
                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* If unlinked, display prominent Device Pairing Card right on overview */}
          {!telemetry.isAuthorized ? (
            <ParentDeviceLinkingCard
              telemetry={telemetry}
              onRegenerateCode={onRegeneratePairingCode}
              onUnlinkDevice={onResetAuthorization}
              onSimulateChildScan={onSwitchToChildMode}
            />
          ) : (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">Secure Device Link Active</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Mutual Consent Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Paired with {telemetry.deviceName} &bull; Pairing Code: <strong className="font-mono text-slate-700">{telemetry.pairingCode}</strong> &bull; {telemetry.authorizedAt}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('auth')}
                className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                View QR &amp; Pairing Keys
              </button>
            </div>
          )}

          {/* Quick Metrics 4-Box Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Location */}
            <div
              onClick={() => setActiveTab('location')}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span className="font-semibold">Current Location</span>
                <MapPin className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <p className="font-bold text-slate-900 text-sm truncate">
                {telemetry.currentLocation.address.split(',')[0]}
              </p>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
                Inside Safe Zone • {telemetry.currentLocation.timestamp}
              </span>
            </div>

            {/* Metric 2: Screen Time */}
            <div
              onClick={() => setActiveTab('screentime')}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span className="font-semibold">Screen Time Today</span>
                <Clock className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
              <p className="font-bold text-slate-900 text-sm">
                {Math.floor(totalUsedMinutes / 60)}h {totalUsedMinutes % 60}m used
              </p>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">
                Limit: {Math.floor(totalAllowedMinutes / 60)}h {totalAllowedMinutes % 60}m
              </span>
            </div>

            {/* Metric 3: App Controls */}
            <div
              onClick={() => setActiveTab('apps')}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span className="font-semibold">App Restrictions</span>
                <Smartphone className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
              <p className="font-bold text-slate-900 text-sm">
                {telemetry.apps.filter((a) => a.isBlocked).length} Blocked App
              </p>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">
                {telemetry.apps.length} monitored apps
              </span>
            </div>

            {/* Metric 4: Web Guard */}
            <div
              onClick={() => setActiveTab('web')}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span className="font-semibold">SafeSearch &amp; Web Filter</span>
                <Globe className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <p className="font-bold text-slate-900 text-sm">
                {telemetry.webCategories.filter((c) => c.isBlocked).length} Categories Blocked
              </p>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
                SafeSearch Enforced
              </span>
            </div>
          </div>

          {/* 7-Day Screen Time by Category Bar Chart (Recharts) */}
          <div className="space-y-2">
            <WeeklyCategoryUsageChart
              data={telemetry.dailyUsageHistory || []}
              dailyLimitMinutes={telemetry.screenTime.dailyLimitMinutes}
              childName={telemetry.childName}
            />
          </div>

          {/* Map Preview & Recent Activity split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Live Location Radar</h3>
                <button
                  onClick={() => setActiveTab('location')}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  Full Map Controls <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <InteractiveMap
                telemetry={telemetry}
                onUpdateLocation={onUpdateLocation}
                onAddGeofence={onAddGeofence}
                onRemoveGeofence={onRemoveGeofence}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Recent Alerts</h3>
                <button
                  onClick={() => setActiveTab('activity')}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <ActivityLog
                telemetry={telemetry}
                onMarkAllRead={onMarkAllNotificationsRead}
                onClearLog={onClearNotificationLog}
                onSelectMap={() => setActiveTab('location')}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'location' && (
        <InteractiveMap
          telemetry={telemetry}
          onUpdateLocation={onUpdateLocation}
          onAddGeofence={onAddGeofence}
          onRemoveGeofence={onRemoveGeofence}
        />
      )}

      {activeTab === 'screentime' && (
        <div className="space-y-6">
          <ScreenTimeManager
            telemetry={telemetry}
            onUpdateSchedule={onUpdateSchedule}
            onToggleDeviceLock={onToggleDeviceLock}
            onResolveBonusRequest={onResolveBonusRequest}
          />

          <WeeklyCategoryUsageChart
            data={telemetry.dailyUsageHistory || []}
            dailyLimitMinutes={telemetry.screenTime.dailyLimitMinutes}
            childName={telemetry.childName}
          />
        </div>
      )}

      {activeTab === 'apps' && (
        <AppManager
          telemetry={telemetry}
          onToggleBlock={onToggleAppBlock}
          onSetTimeLimit={onSetAppTimeLimit}
        />
      )}

      {activeTab === 'web' && (
        <WebRestrictions
          telemetry={telemetry}
          onToggleCategory={onToggleWebCategory}
          onAddCustomRule={onAddWebCustomRule}
          onRemoveCustomRule={onRemoveWebCustomRule}
        />
      )}

      {activeTab === 'activity' && (
        <ActivityLog
          telemetry={telemetry}
          onMarkAllRead={onMarkAllNotificationsRead}
          onClearLog={onClearNotificationLog}
          onSelectMap={() => setActiveTab('location')}
        />
      )}

      {activeTab === 'auth' && (
        <AuthorizationModal
          telemetry={telemetry}
          onUpdatePin={onUpdateParentPin}
          onRegenerateCode={onRegeneratePairingCode}
          onResetAuthorization={onResetAuthorization}
          onSwitchToChildMode={onSwitchToChildMode}
        />
      )}
    </div>
  );
};
