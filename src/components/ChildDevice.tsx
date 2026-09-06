import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Battery,
  BatteryCharging,
  Wifi,
  Signal,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  PlusCircle,
  HelpCircle,
  Globe,
  Languages,
  Video,
  Gamepad2,
  Box,
  Headphones,
  CheckCircle2,
  XCircle,
  Send,
  AlertOctagon,
  Eye,
  Info
} from 'lucide-react';
import { DeviceTelemetry, AppUsageItem, ConsentPermissions } from '../types';
import { ChildLinkingFlow } from './ChildLinkingFlow';

interface ChildDeviceProps {
  telemetry: DeviceTelemetry;
  onRequestMoreTime: (minutes: number, reason: string) => void;
  onTriggerSos: (reason: string) => void;
  onUpdateBattery: (battery: number, isCharging: boolean) => void;
  onAttemptBlockedAction: (type: 'app' | 'web', target: string) => void;
  onCompletePairing?: (consent: ConsentPermissions) => void;
  onUnlinkDevice?: () => void;
}

export const ChildDevice: React.FC<ChildDeviceProps> = ({
  telemetry,
  onRequestMoreTime,
  onTriggerSos,
  onUpdateBattery,
  onAttemptBlockedAction,
  onCompletePairing,
  onUnlinkDevice,
}) => {
  const {
    deviceName,
    childName,
    batteryPercent,
    isCharging,
    wifiSsid,
    isDeviceLocked,
    screenTime,
    apps,
    webCategories,
    webCustomRules,
  } = telemetry;

  const [showPairingFlow, setShowPairingFlow] = useState(!telemetry.isAuthorized);

  useEffect(() => {
    if (!telemetry.isAuthorized) {
      setShowPairingFlow(true);
    }
  }, [telemetry.isAuthorized]);

  const [activeApp, setActiveApp] = useState<AppUsageItem | null>(null);
  const [blockedAlertModal, setBlockedAlertModal] = useState<{
    appName: string;
    reason: string;
  } | null>(null);
  const [showTimeRequestModal, setShowTimeRequestModal] = useState(false);
  const [requestMinutes, setRequestMinutes] = useState(20);
  const [requestReason, setRequestReason] = useState('');
  const [requestSentSuccess, setRequestSentSuccess] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // SOS button press-and-hold logic
  const [sosHolding, setSosHolding] = useState(false);
  const [sosProgress, setSosProgress] = useState(0);
  const [sosSentSuccess, setSosSentSuccess] = useState(false);

  // Safe Browser simulator state
  const [browserUrl, setBrowserUrl] = useState('https://khanacademy.org');
  const [browserInput, setBrowserInput] = useState('https://khanacademy.org');
  const [browserState, setBrowserState] = useState<'allowed' | 'blocked'>('allowed');
  const [browserBlockReason, setBrowserBlockReason] = useState('');

  // Duolingo mini-game state
  const [duoScore, setDuoScore] = useState(0);
  const [duoAnswered, setDuoAnswered] = useState<string | null>(null);

  const totalUsedMinutes = apps.reduce((acc, app) => acc + app.usageMinutesToday, 0);
  const totalAllowed = screenTime.dailyLimitMinutes + screenTime.bonusMinutesToday;
  const remainingMinutes = Math.max(0, totalAllowed - totalUsedMinutes);

  // SOS hold timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sosHolding) {
      timer = setInterval(() => {
        setSosProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setSosHolding(false);
            onTriggerSos(`Emergency SOS activated by ${childName} from ${telemetry.currentLocation.address}`);
            setSosSentSuccess(true);
            setTimeout(() => setSosSentSuccess(false), 5000);
            return 0;
          }
          return prev + 25;
        });
      }, 200);
    } else {
      setSosProgress(0);
    }
    return () => clearInterval(timer);
  }, [sosHolding, childName, telemetry.currentLocation.address, onTriggerSos]);

  const handleOpenApp = (app: AppUsageItem) => {
    // If device is totally locked
    if (isDeviceLocked) {
      setBlockedAlertModal({
        appName: app.name,
        reason: 'Your parent has temporarily paused your device. Non-emergency apps are restricted.',
      });
      onAttemptBlockedAction('app', app.name);
      return;
    }

    // If app is individually blocked
    if (app.isBlocked) {
      setBlockedAlertModal({
        appName: app.name,
        reason: `Your parent has restricted ${app.name}. Tap "Ask for Time" if you need permission.`,
      });
      onAttemptBlockedAction('app', app.name);
      return;
    }

    // If app daily limit is reached
    if (app.timeLimitMinutes !== null && app.usageMinutesToday >= app.timeLimitMinutes) {
      setBlockedAlertModal({
        appName: app.name,
        reason: `Daily limit reached (${app.timeLimitMinutes} min limit used today). Take a break!`,
      });
      onAttemptBlockedAction('app', app.name);
      return;
    }

    setActiveApp(app);
  };

  const handleBrowserNavigate = (urlToTest: string) => {
    const raw = urlToTest.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    setBrowserUrl(urlToTest);

    // Check custom blacklist
    const customMatch = webCustomRules.find((r) => raw.includes(r.domain) || r.domain.includes(raw));
    if (customMatch && customMatch.action === 'block') {
      setBrowserState('blocked');
      setBrowserBlockReason(`Blocked by Parental Control Blacklist rule (${customMatch.domain})`);
      onAttemptBlockedAction('web', urlToTest);
      return;
    }

    // Check categories
    for (const cat of webCategories) {
      if (cat.isBlocked) {
        if (cat.sampleSites.some((s) => raw.includes(s) || s.includes(raw))) {
          setBrowserState('blocked');
          setBrowserBlockReason(`Blocked by Category Filter: ${cat.name}`);
          onAttemptBlockedAction('web', urlToTest);
          return;
        }
        if (cat.id === 'cat-adult' && (raw.includes('adult') || raw.includes('porn') || raw.includes('xxx'))) {
          setBrowserState('blocked');
          setBrowserBlockReason(`Blocked by Adult & Explicit Content Filter`);
          onAttemptBlockedAction('web', urlToTest);
          return;
        }
        if (cat.id === 'cat-gambling' && (raw.includes('casino') || raw.includes('bet') || raw.includes('poker'))) {
          setBrowserState('blocked');
          setBrowserBlockReason(`Blocked by Gambling & Betting Filter`);
          onAttemptBlockedAction('web', urlToTest);
          return;
        }
        if (cat.id === 'cat-violence' && (raw.includes('weapon') || raw.includes('gun'))) {
          setBrowserState('blocked');
          setBrowserBlockReason(`Blocked by Violence & Weapons Filter`);
          onAttemptBlockedAction('web', urlToTest);
          return;
        }
      }
    }

    setBrowserState('allowed');
    setBrowserBlockReason('');
  };

  const submitTimeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestMoreTime(requestMinutes, requestReason.trim() || 'Need more screen time');
    setShowTimeRequestModal(false);
    setRequestReason('');
    setRequestSentSuccess(true);
    setTimeout(() => setRequestSentSuccess(false), 4000);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'youtube':
        return <Video className="w-6 h-6 text-rose-600" />;
      case 'gamepad-2':
        return <Gamepad2 className="w-6 h-6 text-purple-600" />;
      case 'languages':
        return <Languages className="w-6 h-6 text-emerald-600" />;
      case 'globe':
        return <Globe className="w-6 h-6 text-blue-600" />;
      case 'box':
        return <Box className="w-6 h-6 text-amber-600" />;
      case 'headphones':
        return <Headphones className="w-6 h-6 text-cyan-600" />;
      default:
        return <Globe className="w-6 h-6 text-slate-600" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-6">
      {/* Device Exterior Frame */}
      <div className="relative w-full max-w-[380px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700">
        {/* Device Speaker & Camera Notch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          <div className="w-8 h-1 rounded-full bg-slate-800" />
        </div>

        {/* Screen Canvas */}
        <div className="relative bg-slate-50 w-full h-[660px] rounded-[34px] overflow-hidden flex flex-col justify-between select-none">
          {/* Status Bar */}
          <div className="pt-3 px-6 pb-2 flex items-center justify-between text-xs font-semibold text-slate-800 bg-white/70 backdrop-blur-xs border-b border-slate-200 z-20">
            <span>3:42 PM</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1 font-bold">
                <ShieldCheck className="w-3 h-3 text-blue-600" /> Protected
              </span>
              <Wifi className="w-3.5 h-3.5 text-slate-700" />
              <Signal className="w-3.5 h-3.5 text-slate-700" />
              <div className="flex items-center gap-0.5">
                <span className="text-[11px] font-bold">{batteryPercent}%</span>
                {isCharging ? (
                  <BatteryCharging className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Battery
                    className={`w-4 h-4 ${
                      batteryPercent <= 15
                        ? 'text-rose-600 animate-pulse'
                        : batteryPercent <= 30
                        ? 'text-amber-600'
                        : 'text-slate-700'
                    }`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* SOS Sent Banner */}
          {sosSentSuccess && (
            <div className="absolute top-12 left-3 right-3 z-40 p-3 bg-rose-600 text-white rounded-xl shadow-lg text-xs flex items-center gap-2 animate-bounce">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">EMERGENCY SOS SENT</p>
                <p className="text-[10px] text-rose-100">
                  Your parent was notified with your current GPS location!
                </p>
              </div>
            </div>
          )}

          {/* Time Request Sent Banner */}
          {requestSentSuccess && (
            <div className="absolute top-12 left-3 right-3 z-40 p-3 bg-emerald-600 text-white rounded-xl shadow-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p className="font-medium text-[11px]">
                Time extension request sent to Parent! Waiting for approval.
              </p>
            </div>
          )}

          {/* Device Locked Overlay: When Parent paused device */}
          {isDeviceLocked ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 to-slate-800 text-white z-20">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 animate-pulse">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-1">Device Paused</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mb-6">
                Your parent has locked this device for downtime, rest, or study hours. Non-essential apps are suspended.
              </p>

              <div className="p-3 bg-white/10 rounded-xl text-xs text-slate-300 mb-6 w-full max-w-xs text-left">
                <div className="flex items-center gap-2 text-white font-semibold mb-1">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  Emergency Calls Only
                </div>
                <p className="text-[11px]">
                  You can still place urgent emergency calls or press the SOS button below.
                </p>
              </div>

              {/* Emergency SOS button inside lockscreen */}
              <button
                onMouseDown={() => setSosHolding(true)}
                onMouseUp={() => setSosHolding(false)}
                onTouchStart={() => setSosHolding(true)}
                onTouchEnd={() => setSosHolding(false)}
                className="relative overflow-hidden w-full max-w-xs py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <AlertOctagon className="w-4 h-4" />
                {sosHolding ? `Hold for SOS (${sosProgress}%)` : 'Hold for Emergency SOS'}
                {sosHolding && (
                  <div
                    style={{ width: `${sosProgress}%` }}
                    className="absolute bottom-0 left-0 h-1 bg-white transition-all"
                  />
                )}
              </button>
            </div>
          ) : (!telemetry.isAuthorized || showPairingFlow) ? (
            /* Secure Device Linking & Consent Flow */
            <ChildLinkingFlow
              telemetry={telemetry}
              onCompletePairing={(consent) => {
                onCompletePairing?.(consent);
                setShowPairingFlow(false);
              }}
              onCancel={telemetry.isAuthorized ? () => setShowPairingFlow(false) : undefined}
            />
          ) : activeApp ? (
            /* Active Mini-App Simulator */
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {/* Mini App Top Header */}
              <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIcon(activeApp.iconName)}
                  <span className="font-bold text-xs text-slate-800">{activeApp.name}</span>
                </div>
                <button
                  onClick={() => setActiveApp(null)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                >
                  Exit App
                </button>
              </div>

              {/* Dynamic App Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeApp.id === 'app-duolingo' ? (
                  /* Duolingo simulator */
                  <div className="space-y-4">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800">
                        Daily Streak: 14 Days 🔥
                      </span>
                      <span className="text-xs font-semibold text-emerald-700">XP: {duoScore}</span>
                    </div>

                    <div className="text-center py-4">
                      <span className="text-3xl block mb-2">🦉</span>
                      <p className="text-xs text-slate-500">Translate to Spanish:</p>
                      <h4 className="font-bold text-slate-800 text-base mt-1">&quot;The cat is sleeping&quot;</h4>
                    </div>

                    <div className="space-y-2">
                      {[
                        { text: 'El gato está durmiendo', correct: true },
                        { text: 'El perro corre rápido', correct: false },
                        { text: 'La manzana es roja', correct: false },
                      ].map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setDuoAnswered(opt.text);
                            if (opt.correct) setDuoScore((s) => s + 10);
                          }}
                          className={`w-full p-3 rounded-xl border text-xs font-semibold text-left transition-colors ${
                            duoAnswered === opt.text
                              ? opt.correct
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                                : 'bg-rose-100 border-rose-300 text-rose-900'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {opt.text}
                        </button>
                      ))}
                    </div>

                    {duoAnswered && (
                      <p className="text-center text-xs font-bold text-emerald-600">
                        {duoAnswered === 'El gato está durmiendo'
                          ? '¡Correcto! +10 XP'
                          : 'Try again!'}
                      </p>
                    )}
                  </div>
                ) : activeApp.id === 'app-chrome' ? (
                  /* Safe Browser Simulator */
                  <div className="space-y-3">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={browserInput}
                        onChange={(e) => setBrowserInput(e.target.value)}
                        placeholder="Enter website URL..."
                        className="flex-1 text-[11px] px-2.5 py-1.5 border border-slate-300 rounded-lg"
                      />
                      <button
                        onClick={() => handleBrowserNavigate(browserInput)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg"
                      >
                        Go
                      </button>
                    </div>

                    <div className="flex gap-1 overflow-x-auto text-[10px]">
                      {['khanacademy.org', 'wikipedia.org', 'discord.com', 'adult-sites.com'].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setBrowserInput(`https://${s}`);
                            handleBrowserNavigate(`https://${s}`);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded whitespace-nowrap text-slate-700"
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    {browserState === 'blocked' ? (
                      <div className="p-6 text-center bg-rose-50 border border-rose-200 rounded-2xl mt-4">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <XCircle className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-rose-900 text-sm">Website Restricted</h4>
                        <p className="text-xs text-rose-700 mt-1">{browserBlockReason}</p>
                        <p className="text-[10px] text-slate-500 mt-3">
                          Protected by AirDroid Parental Control SafeFilter
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                          <ShieldCheck className="w-4 h-4" /> Safe Page Verified
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">{browserUrl}</h4>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Educational content loaded. Google SafeSearch is strictly enforced for all queries on this device.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Generic kid app */
                  <div className="p-6 text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                      {getIcon(activeApp.iconName)}
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">{activeApp.name}</h3>
                    <p className="text-xs text-slate-500">
                      You have used {activeApp.usageMinutesToday} mins today.
                      {activeApp.timeLimitMinutes &&
                        ` (${activeApp.timeLimitMinutes - activeApp.usageMinutesToday} mins remaining before limit)`}
                    </p>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                      Interactive sandbox running safely with parental monitoring.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Home Screen Launcher */
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* Device Pairing & Mutual Consent Status Pill */}
              <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-800 text-[11px] block leading-none">
                      Linked to Parent Hub
                    </span>
                    <span className="text-[10px] text-emerald-700">Consent &amp; Protections Active</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowPairingFlow(true)}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  Pairing Info
                </button>
              </div>

              {/* Screen Time Remaining Banner Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-2xl shadow-md">
                <div className="flex items-center justify-between text-xs opacity-90 mb-1">
                  <span>Today&apos;s Screen Time</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black tracking-tight mb-2">
                  {Math.floor(remainingMinutes / 60)}h {remainingMinutes % 60}m{' '}
                  <span className="text-xs font-normal text-blue-200">left</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-3">
                  <div
                    style={{
                      width: `${Math.min(100, (totalUsedMinutes / (totalAllowed || 1)) * 100)}%`,
                    }}
                    className="bg-emerald-400 h-full transition-all"
                  />
                </div>

                <button
                  id="btn-child-request-time"
                  onClick={() => setShowTimeRequestModal(true)}
                  className="w-full py-2 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Request More Screen Time
                </button>
              </div>

              {/* Apps Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">My Apps</span>
                  <span className="text-[10px] text-slate-400">Tap to Launch</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {apps.map((app) => {
                    const isLimitHit =
                      app.timeLimitMinutes !== null &&
                      app.usageMinutesToday >= app.timeLimitMinutes;
                    const isRestricted = app.isBlocked || isLimitHit;

                    return (
                      <button
                        key={app.id}
                        onClick={() => handleOpenApp(app)}
                        className={`relative p-3 rounded-2xl border transition-transform active:scale-95 flex flex-col items-center justify-center text-center ${
                          isRestricted
                            ? 'bg-slate-100 border-slate-200 opacity-75'
                            : 'bg-white border-slate-200 shadow-xs hover:border-blue-400'
                        }`}
                      >
                        {isRestricted && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                            <Lock className="w-3 h-3" />
                          </div>
                        )}
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-1.5">
                          {getIcon(app.iconName)}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-800 line-clamp-1">
                          {app.name}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          {app.usageMinutesToday}m used
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Emergency SOS & Privacy Cards */}
              <div className="pt-2 space-y-2">
                {/* Hold to SOS */}
                <button
                  onMouseDown={() => setSosHolding(true)}
                  onMouseUp={() => setSosHolding(false)}
                  onTouchStart={() => setSosHolding(true)}
                  onTouchEnd={() => setSosHolding(false)}
                  className="relative overflow-hidden w-full py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <AlertOctagon className="w-4 h-4" />
                  {sosHolding ? `Hold for SOS (${sosProgress}%)` : 'Press & Hold for Emergency SOS'}
                  {sosHolding && (
                    <div
                      style={{ width: `${sosProgress}%` }}
                      className="absolute bottom-0 left-0 h-1.5 bg-white transition-all"
                    />
                  )}
                </button>

                <button
                  onClick={() => setShowPrivacyModal(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  What data is shared with my parent?
                </button>
              </div>
            </div>
          )}

          {/* Bottom Device Bar Simulation */}
          <div className="p-2 bg-white border-t border-slate-200 flex items-center justify-center">
            <div className="w-24 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>

      {/* Battery Simulation Toolbar (Outside the phone mockup for easy testing) */}
      <div className="mt-4 w-full max-w-[380px] bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Battery className="w-4 h-4 text-slate-500" /> Test Device Battery:
          </span>
          <span className="font-bold text-slate-800">{batteryPercent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="5"
            max="100"
            value={batteryPercent}
            onChange={(e) => onUpdateBattery(Number(e.target.value), isCharging)}
            className="flex-1 accent-blue-600"
          />
          <button
            onClick={() => onUpdateBattery(batteryPercent, !isCharging)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
              isCharging
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BatteryCharging className="w-3 h-3" />
            {isCharging ? 'Plugged In' : 'Plug In'}
          </button>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400">
          <button
            onClick={() => onUpdateBattery(12, false)}
            className="hover:text-rose-600 font-medium"
          >
            Trigger &lt;15% Low Alert
          </button>
          <button
            onClick={() => onUpdateBattery(85, true)}
            className="hover:text-blue-600 font-medium"
          >
            Full Charge (85%)
          </button>
        </div>
      </div>

      {/* Blocked App Alert Modal */}
      {blockedAlertModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-800 text-base mb-1">
              {blockedAlertModal.appName} Restricted
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              {blockedAlertModal.reason}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setBlockedAlertModal(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setBlockedAlertModal(null);
                  setShowTimeRequestModal(true);
                  setRequestReason(`Need access to ${blockedAlertModal.appName}`);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
              >
                Ask for Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request More Time Modal */}
      {showTimeRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 text-base mb-1">Ask Parent for Screen Time</h4>
            <p className="text-xs text-slate-500 mb-4">
              Send an instant notification to your parent&apos;s phone asking for extra minutes.
            </p>

            <form onSubmit={submitTimeRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  How many extra minutes?
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setRequestMinutes(mins)}
                      className={`py-2 rounded-xl font-bold border transition-colors ${
                        requestMinutes === mins
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      +{mins} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for parent:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Need to finish homework on Duolingo"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTimeRequestModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send to Parent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transparency / Privacy Info Sheet */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  What My Parents Can See &amp; What Is Private
                </h4>
                <p className="text-xs text-slate-500">Mutual Authorization Agreement</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                <p className="font-bold mb-1">✅ What is monitored for your safety:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-emerald-800">
                  <li>Your current GPS location and safe-zone arrival alerts</li>
                  <li>Total hours spent on games, social media, and apps</li>
                  <li>Device battery level and SOS emergency button alerts</li>
                  <li>Web content filtering against harmful websites</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                <p className="font-bold mb-1 text-slate-800">🔒 What stays private:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                  <li>Your personal passwords and private credentials are never shared</li>
                  <li>Personal photo albums and camera are never silently recorded</li>
                  <li>Private chat conversations are not keylogged or stored</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
