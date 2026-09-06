/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  Users,
  Split,
  RefreshCw,
  Bell,
  Lock,
  Battery,
  MapPin,
  HelpCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import {
  DeviceTelemetry,
  LocationPoint,
  GeofenceZone,
  ScreenTimeSchedule,
  ActivityNotification,
  BonusTimeRequest,
  ConsentPermissions
} from './types';
import {
  loadTelemetry,
  saveTelemetry,
  subscribeToTelemetry,
  resetTelemetry,
  generateNumericCode,
  createPairingSession
} from './services/storage';
import { ParentDashboard } from './components/ParentDashboard';
import { ChildDevice } from './components/ChildDevice';

export default function App() {
  const [telemetry, setTelemetry] = useState<DeviceTelemetry>(() => loadTelemetry());
  const [viewMode, setViewMode] = useState<'parent' | 'child' | 'split'>('parent');
  const [newlyLinkedModal, setNewlyLinkedModal] = useState(false);
  const [notificationToast, setNotificationToast] = useState<ActivityNotification | null>(null);

  // Subscribe to real-time updates across tabs & actions
  useEffect(() => {
    const unsubscribe = subscribeToTelemetry((updatedData) => {
      setTelemetry(updatedData);
    });
    return () => unsubscribe();
  }, []);

  const updateAndPersist = (updater: (prev: DeviceTelemetry) => DeviceTelemetry) => {
    setTelemetry((prev) => {
      const next = updater(prev);
      saveTelemetry(next);
      return next;
    });
  };

  const showToast = (notif: ActivityNotification) => {
    setNotificationToast(notif);
    setTimeout(() => setNotificationToast(null), 4500);
  };

  // Helper to add activity log notification
  const logNotification = (
    type: ActivityNotification['type'],
    severity: ActivityNotification['severity'],
    title: string,
    message: string
  ) => {
    const newNotif: ActivityNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      severity,
      title,
      message,
      timestamp: 'Just now',
      read: false,
    };
    updateAndPersist((prev) => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications],
    }));
    showToast(newNotif);
  };

  // Actions
  const handleToggleDeviceLock = (locked: boolean) => {
    updateAndPersist((prev) => ({
      ...prev,
      isDeviceLocked: locked,
    }));
    logNotification(
      'screen_time',
      locked ? 'warning' : 'info',
      locked ? 'Device Paused by Parent' : 'Device Access Resumed',
      locked
        ? `Instant pause engaged. Non-emergency apps on ${telemetry.childName}'s device are locked.`
        : `Normal device permissions restored for ${telemetry.childName}.`
    );
  };

  const handleToggleAppBlock = (appId: string) => {
    let appName = '';
    let isNowBlocked = false;

    updateAndPersist((prev) => {
      const updatedApps = prev.apps.map((app) => {
        if (app.id === appId) {
          appName = app.name;
          isNowBlocked = !app.isBlocked;
          return { ...app, isBlocked: !app.isBlocked };
        }
        return app;
      });
      return { ...prev, apps: updatedApps };
    });

    logNotification(
      'blocked_app',
      isNowBlocked ? 'warning' : 'info',
      isNowBlocked ? `App Restricted: ${appName}` : `App Allowed: ${appName}`,
      isNowBlocked
        ? `${appName} was blocked from parental dashboard.`
        : `${appName} restriction was lifted.`
    );
  };

  const handleSetAppTimeLimit = (appId: string, limitMinutes: number | null) => {
    let appName = '';
    updateAndPersist((prev) => {
      const updatedApps = prev.apps.map((app) => {
        if (app.id === appId) {
          appName = app.name;
          return { ...app, timeLimitMinutes: limitMinutes };
        }
        return app;
      });
      return { ...prev, apps: updatedApps };
    });

    logNotification(
      'screen_time',
      'info',
      `App Time Limit: ${appName}`,
      limitMinutes
        ? `Daily limit for ${appName} set to ${limitMinutes} minutes.`
        : `Daily limit removed for ${appName}.`
    );
  };

  const handleUpdateSchedule = (schedule: Partial<ScreenTimeSchedule>) => {
    updateAndPersist((prev) => ({
      ...prev,
      screenTime: { ...prev.screenTime, ...schedule },
    }));
    logNotification(
      'screen_time',
      'info',
      'Screen Time Policy Updated',
      `New daily allowance of ${schedule.dailyLimitMinutes || telemetry.screenTime.dailyLimitMinutes} mins and bedtime downtime configured.`
    );
  };

  const handleUpdateLocation = (newLocation: LocationPoint) => {
    updateAndPersist((prev) => {
      // Check if location crossed any geofence
      const matchedZone = prev.geofences.find((g) => {
        const dLat = (newLocation.lat - g.lat) * 111000;
        const dLng = (newLocation.lng - g.lng) * 88000;
        return Math.sqrt(dLat * dLat + dLng * dLng) <= g.radiusMeters;
      });

      return {
        ...prev,
        currentLocation: newLocation,
        locationHistory: [newLocation, ...prev.locationHistory.slice(0, 8)],
      };
    });

    // Check geofence notification
    const matchedZone = telemetry.geofences.find((g) => {
      const dLat = (newLocation.lat - g.lat) * 111000;
      const dLng = (newLocation.lng - g.lng) * 88000;
      return Math.sqrt(dLat * dLat + dLng * dLng) <= g.radiusMeters;
    });

    if (matchedZone && matchedZone.alertOnEnter) {
      logNotification(
        'geofence',
        'info',
        `Arrived at ${matchedZone.name}`,
        `${telemetry.childName} arrived inside safe zone boundary.`
      );
    }
  };

  const handleAddGeofence = (zone: GeofenceZone) => {
    updateAndPersist((prev) => ({
      ...prev,
      geofences: [...prev.geofences, zone],
    }));
    logNotification(
      'geofence',
      'info',
      'Safe Geofence Added',
      `New safe boundary "${zone.name}" created with ${zone.radiusMeters}m radius.`
    );
  };

  const handleRemoveGeofence = (id: string) => {
    const zoneName = telemetry.geofences.find((g) => g.id === id)?.name || 'Safe Zone';
    updateAndPersist((prev) => ({
      ...prev,
      geofences: prev.geofences.filter((g) => g.id !== id),
    }));
    logNotification('geofence', 'info', 'Geofence Removed', `Boundary for "${zoneName}" was deleted.`);
  };

  const handleUpdateBattery = (battery: number, isCharging: boolean) => {
    updateAndPersist((prev) => ({
      ...prev,
      batteryPercent: battery,
      isCharging,
    }));

    if (battery <= 15 && !isCharging) {
      logNotification(
        'battery',
        'warning',
        'Low Battery Warning (<15%)',
        `${telemetry.deviceName} battery is at ${battery}%. Please remind ${telemetry.childName} to charge.`
      );
    }
  };

  const handleTriggerSos = (reason: string) => {
    logNotification(
      'sos',
      'critical',
      'EMERGENCY SOS ALERT ACTIVATED',
      `${reason}. High priority alert dispatched to parent.`
    );
  };

  const handleRequestMoreTime = (minutes: number, reason: string) => {
    const newReq: BonusTimeRequest = {
      id: `req-${Date.now()}`,
      childName: telemetry.childName,
      requestedMinutes: minutes,
      reason,
      requestedAt: 'Just now',
      status: 'pending',
    };

    updateAndPersist((prev) => ({
      ...prev,
      bonusRequests: [newReq, ...prev.bonusRequests],
    }));

    logNotification(
      'request',
      'info',
      'Time Extension Requested',
      `${telemetry.childName} asked for +${minutes} extra minutes ("${reason}").`
    );
  };

  const handleResolveBonusRequest = (
    requestId: string,
    approve: boolean,
    grantedMinutes?: number
  ) => {
    const minutesToAdd = approve ? grantedMinutes || 15 : 0;

    updateAndPersist((prev) => {
      const updatedRequests = prev.bonusRequests.map((r) =>
        r.id === requestId ? { ...r, status: approve ? ('approved' as const) : ('rejected' as const) } : r
      );
      return {
        ...prev,
        bonusRequests: updatedRequests,
        screenTime: {
          ...prev.screenTime,
          bonusMinutesToday: prev.screenTime.bonusMinutesToday + minutesToAdd,
        },
      };
    });

    logNotification(
      'screen_time',
      approve ? 'info' : 'warning',
      approve ? `Approved +${minutesToAdd}m Screen Time` : 'Declined Time Extension',
      approve
        ? `Parent approved +${minutesToAdd} bonus minutes for ${telemetry.childName}.`
        : `Parent declined time extension request.`
    );
  };

  const handleToggleWebCategory = (categoryId: string) => {
    let catName = '';
    let isNowBlocked = false;

    updateAndPersist((prev) => {
      const updatedCategories = prev.webCategories.map((c) => {
        if (c.id === categoryId) {
          catName = c.name;
          isNowBlocked = !c.isBlocked;
          return { ...c, isBlocked: !c.isBlocked };
        }
        return c;
      });
      return { ...prev, webCategories: updatedCategories };
    });

    logNotification(
      'blocked_web',
      'info',
      'Web Filter Rule Changed',
      `Category "${catName}" is now ${isNowBlocked ? 'BLOCKED' : 'ALLOWED'}.`
    );
  };

  const handleAddWebCustomRule = (domain: string, action: 'block' | 'allow') => {
    const newRule = {
      id: `rule-${Date.now()}`,
      domain,
      action,
      addedAt: 'Just now',
    };
    updateAndPersist((prev) => ({
      ...prev,
      webCustomRules: [newRule, ...prev.webCustomRules],
    }));
    logNotification(
      'blocked_web',
      'info',
      `Custom Website Rule: ${domain}`,
      `Domain "${domain}" is set to ${action === 'block' ? 'Always Blocked' : 'Always Allowed'}.`
    );
  };

  const handleRemoveWebCustomRule = (ruleId: string) => {
    updateAndPersist((prev) => ({
      ...prev,
      webCustomRules: prev.webCustomRules.filter((r) => r.id !== ruleId),
    }));
  };

  const handleAttemptBlockedAction = (type: 'app' | 'web', target: string) => {
    logNotification(
      type === 'app' ? 'blocked_app' : 'blocked_web',
      'warning',
      type === 'app' ? `Restricted App Access Attempt` : `Blocked Website Attempt`,
      `${telemetry.childName} attempted to access ${type === 'app' ? 'app' : 'website'}: "${target}". Filter prevented opening.`
    );
  };

  const handleToggleRingDevice = () => {
    const nextState = !telemetry.isRingAlarmActive;
    updateAndPersist((prev) => ({
      ...prev,
      isRingAlarmActive: nextState,
    }));
    if (nextState) {
      logNotification(
        'info' as any,
        'info',
        'Find Device Alarm Ringing',
        `Sound alarm activated on ${telemetry.deviceName}.`
      );
    }
  };

  const handleUpdateParentPin = (newPin: string) => {
    updateAndPersist((prev) => ({
      ...prev,
      parentPin: newPin,
    }));
    logNotification('auth', 'info', 'Security PIN Changed', 'Parent master PIN code was updated.');
  };

  const handleRegeneratePairingCode = () => {
    const newCode = generateNumericCode();
    const newSession = createPairingSession(newCode);
    updateAndPersist((prev) => ({
      ...prev,
      pairingCode: newCode,
      pairingDetails: newSession,
    }));
    logNotification(
      'auth',
      'info',
      'New Pairing Code Generated',
      `Temporary 6-digit code: ${newCode.slice(0, 3)} ${newCode.slice(3)}`
    );
  };

  const handleCompletePairing = (consent: ConsentPermissions) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    updateAndPersist((prev) => ({
      ...prev,
      isAuthorized: true,
      authorizedAt: `Mutual Informed Consent verified at ${timestamp}`,
      pairingDetails: {
        ...(prev.pairingDetails || createPairingSession(prev.pairingCode)),
        connectionState: 'connected',
        linkedAt: `Today at ${timestamp}`,
        consent,
      },
    }));
    logNotification(
      'auth',
      'info',
      '🎉 Both Devices Confirmed Connection!',
      `${telemetry.deviceName} linked with informed child consent. All protective rules are active.`
    );
    setNewlyLinkedModal(true);
  };

  const handleResetAuthorization = () => {
    const newCode = generateNumericCode();
    const newSession = createPairingSession(newCode);
    newSession.connectionState = 'unlinked';
    newSession.consent.consentAgreedByChild = false;

    updateAndPersist((prev) => ({
      ...prev,
      isAuthorized: false,
      pairingCode: newCode,
      pairingDetails: newSession,
    }));
    logNotification(
      'auth',
      'warning',
      'Child Device Unlinked',
      `${telemetry.deviceName} was unlinked. Re-pairing with consent required.`
    );
  };

  const handleResetDemoData = () => {
    if (confirm('Reset all parental control demo telemetry and logs to defaults?')) {
      const reset = resetTelemetry();
      setTelemetry(reset);
      logNotification('auth', 'info', 'Telemetry Reset', 'Reset data to factory defaults.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Top Application Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Parental Control
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  AirDroid Companion
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Safe family device management with mutual child &amp; parent authorization
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              id="mode-parent"
              onClick={() => setViewMode('parent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                viewMode === 'parent'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Parent Mode
            </button>
            <button
              id="mode-child"
              onClick={() => setViewMode('child')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                viewMode === 'child'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              Child Device
            </button>
            <button
              id="mode-split"
              onClick={() => setViewMode('split')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                viewMode === 'split'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View Parent Dashboard and Child Phone side-by-side to test real-time synchronization"
            >
              <Split className="w-3.5 h-3.5 text-indigo-600" />
              Dual Side-by-Side
            </button>
          </div>

          {/* Reset Demo button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDemoData}
              className="text-xs px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors"
              title="Reset sample telemetry to default"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Demo
            </button>
          </div>
        </div>
      </header>

      {/* Floating Push Notification Toast */}
      {notificationToast && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-2xl shadow-xl border flex items-start gap-3 max-w-sm transition-transform animate-fadeIn ${
            notificationToast.severity === 'critical'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          <Bell className="w-5 h-5 shrink-0 text-white" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold">{notificationToast.title}</p>
            <p className="opacity-90 leading-relaxed text-[11px]">{notificationToast.message}</p>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {viewMode === 'parent' ? (
          /* Single View: Parent Dashboard */
          <ParentDashboard
            telemetry={telemetry}
            onUpdateLocation={handleUpdateLocation}
            onAddGeofence={handleAddGeofence}
            onRemoveGeofence={handleRemoveGeofence}
            onUpdateSchedule={handleUpdateSchedule}
            onToggleDeviceLock={handleToggleDeviceLock}
            onResolveBonusRequest={handleResolveBonusRequest}
            onToggleAppBlock={handleToggleAppBlock}
            onSetAppTimeLimit={handleSetAppTimeLimit}
            onToggleWebCategory={handleToggleWebCategory}
            onAddWebCustomRule={handleAddWebCustomRule}
            onRemoveWebCustomRule={handleRemoveWebCustomRule}
            onMarkAllNotificationsRead={() =>
              updateAndPersist((prev) => ({
                ...prev,
                notifications: prev.notifications.map((n) => ({ ...n, read: true })),
              }))
            }
            onClearNotificationLog={() =>
              updateAndPersist((prev) => ({
                ...prev,
                notifications: [],
              }))
            }
            onUpdateParentPin={handleUpdateParentPin}
            onRegeneratePairingCode={handleRegeneratePairingCode}
            onResetAuthorization={handleResetAuthorization}
            onToggleRingDevice={handleToggleRingDevice}
            onSwitchToChildMode={() => setViewMode('child')}
          />
        ) : viewMode === 'child' ? (
          /* Single View: Child Device Companion */
          <div className="flex flex-col items-center">
            <div className="mb-3 text-center">
              <span className="text-xs font-semibold text-slate-500">
                Child Device Companion View ({telemetry.childName}&apos;s Phone)
              </span>
              <p className="text-[11px] text-slate-400">
                Try opening blocked apps like TikTok or Roblox, testing the Safe Browser, or holding the SOS button!
              </p>
            </div>
            <ChildDevice
              telemetry={telemetry}
              onRequestMoreTime={handleRequestMoreTime}
              onTriggerSos={handleTriggerSos}
              onUpdateBattery={handleUpdateBattery}
              onAttemptBlockedAction={handleAttemptBlockedAction}
              onCompletePairing={handleCompletePairing}
              onUnlinkDevice={handleResetAuthorization}
            />
          </div>
        ) : (
          /* Dual Side-by-Side Mode */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 cols: Parent Dashboard */}
            <div className="lg:col-span-7">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" /> Parent Management Dashboard
                </span>
                <span className="text-[11px] text-slate-500">Real-time sync active</span>
              </div>
              <ParentDashboard
                telemetry={telemetry}
                onUpdateLocation={handleUpdateLocation}
                onAddGeofence={handleAddGeofence}
                onRemoveGeofence={handleRemoveGeofence}
                onUpdateSchedule={handleUpdateSchedule}
                onToggleDeviceLock={handleToggleDeviceLock}
                onResolveBonusRequest={handleResolveBonusRequest}
                onToggleAppBlock={handleToggleAppBlock}
                onSetAppTimeLimit={handleSetAppTimeLimit}
                onToggleWebCategory={handleToggleWebCategory}
                onAddWebCustomRule={handleAddWebCustomRule}
                onRemoveWebCustomRule={handleRemoveWebCustomRule}
                onMarkAllNotificationsRead={() =>
                  updateAndPersist((prev) => ({
                    ...prev,
                    notifications: prev.notifications.map((n) => ({ ...n, read: true })),
                  }))
                }
                onClearNotificationLog={() =>
                  updateAndPersist((prev) => ({
                    ...prev,
                    notifications: [],
                  }))
                }
                onUpdateParentPin={handleUpdateParentPin}
                onRegeneratePairingCode={handleRegeneratePairingCode}
                onResetAuthorization={handleResetAuthorization}
                onToggleRingDevice={handleToggleRingDevice}
                onSwitchToChildMode={() => setViewMode('child')}
              />
            </div>

            {/* Right 5 cols: Child Companion Phone */}
            <div className="lg:col-span-5 sticky top-20">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" /> Child Companion Device
                </span>
                <span className="text-[11px] text-slate-500">Live Device Simulation</span>
              </div>
              <ChildDevice
                telemetry={telemetry}
                onRequestMoreTime={handleRequestMoreTime}
                onTriggerSos={handleTriggerSos}
                onUpdateBattery={handleUpdateBattery}
                onAttemptBlockedAction={handleAttemptBlockedAction}
                onCompletePairing={handleCompletePairing}
                onUnlinkDevice={handleResetAuthorization}
              />
            </div>
          </div>
        )}
      </main>

      {/* Mutual Device Connection Success Modal */}
      {newlyLinkedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Connection Confirmed
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Both Devices Successfully Linked!
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                <strong>{telemetry.deviceName}</strong> ({telemetry.childName}) and the Parent
                Dashboard have established an authorized, transparent connection with mutual consent.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Child reviewed &amp; signed informed consent policies</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pairing key verified: <strong className="font-mono">{telemetry.pairingCode}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Private chats, passwords &amp; personal photos remain private</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live GPS safety zone &amp; SOS notifications connected</span>
              </div>
            </div>

            <button
              onClick={() => setNewlyLinkedModal(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 mt-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Shield className="w-4 h-4 text-blue-600" />
            Parental Control &bull; Safe Family Device Manager
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Mutual Child &amp; Parent Authorization Active</span>
            <span>&bull;</span>
            <span>SafeSearch &amp; Geofencing Enforced</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
