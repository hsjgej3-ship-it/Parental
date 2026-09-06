import React, { useState } from 'react';
import {
  Clock,
  Moon,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlusCircle,
  Sun
} from 'lucide-react';
import { DeviceTelemetry, ScreenTimeSchedule, BonusTimeRequest } from '../types';

interface ScreenTimeManagerProps {
  telemetry: DeviceTelemetry;
  onUpdateSchedule: (schedule: Partial<ScreenTimeSchedule>) => void;
  onToggleDeviceLock: (locked: boolean) => void;
  onResolveBonusRequest: (requestId: string, approve: boolean, grantedMinutes?: number) => void;
}

export const ScreenTimeManager: React.FC<ScreenTimeManagerProps> = ({
  telemetry,
  onUpdateSchedule,
  onToggleDeviceLock,
  onResolveBonusRequest,
}) => {
  const { screenTime, apps, isDeviceLocked, bonusRequests } = telemetry;
  const totalUsedMinutes = apps.reduce((acc, app) => acc + app.usageMinutesToday, 0);
  const totalAllowed = screenTime.dailyLimitMinutes + screenTime.bonusMinutesToday;
  const percentUsed = Math.min(100, Math.round((totalUsedMinutes / (totalAllowed || 1)) * 100));

  const [customLimit, setCustomLimit] = useState(screenTime.dailyLimitMinutes);
  const [bedStart, setBedStart] = useState(screenTime.bedtimeStart);
  const [bedEnd, setBedEnd] = useState(screenTime.bedtimeEnd);
  const [isSaved, setIsSaved] = useState(false);

  const handleSavePolicy = () => {
    onUpdateSchedule({
      dailyLimitMinutes: Number(customLimit),
      bedtimeStart: bedStart,
      bedtimeEnd: bedEnd,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const pendingRequests = bonusRequests.filter((r) => r.status === 'pending');

  const formatHoursMins = (totalMinutes: number) => {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Top Quick Action Bar: Instant Pause */}
      <div
        className={`p-4 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
          isDeviceLocked
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              isDeviceLocked ? 'bg-rose-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}
          >
            {isDeviceLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-base">
              {isDeviceLocked ? 'Device Currently Paused & Locked' : 'Child Device Active & Unlocked'}
            </h3>
            <p className="text-xs text-slate-500">
              {isDeviceLocked
                ? `${telemetry.childName}'s device is restricted. All non-emergency apps are blocked.`
                : 'Apps run normally subject to configured screen-time limits and filters.'}
            </p>
          </div>
        </div>

        <button
          id="btn-toggle-instant-lock"
          onClick={() => onToggleDeviceLock(!isDeviceLocked)}
          className={`px-4 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 transition-colors shadow-xs ${
            isDeviceLocked
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white'
          }`}
        >
          {isDeviceLocked ? (
            <>
              <Unlock className="w-4 h-4" />
              Resume Child Access
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Instant Pause Device Now
            </>
          )}
        </button>
      </div>

      {/* Screen Time Usage Overview & Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Gauge Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between md:col-span-1">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Daily Usage
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  percentUsed >= 95
                    ? 'bg-rose-100 text-rose-700'
                    : percentUsed >= 80
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {percentUsed}% Used
              </span>
            </div>

            <div className="my-5 flex flex-col items-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-slate-100"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Gauge Arc */}
                  <path
                    className={
                      percentUsed >= 95
                        ? 'text-rose-500'
                        : percentUsed >= 80
                        ? 'text-amber-500'
                        : 'text-blue-600'
                    }
                    strokeDasharray={`${percentUsed}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-bold text-slate-800 block">
                    {formatHoursMins(totalUsedMinutes)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    of {formatHoursMins(totalAllowed)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Remaining Today:</span>
            <span className="font-semibold text-slate-700">
              {Math.max(0, totalAllowed - totalUsedMinutes)} mins
            </span>
          </div>
        </div>

        {/* Policy Setting Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Screen-Time Allowance & Downtime
                </h4>
                <p className="text-xs text-slate-500">
                  Configure maximum daily screen usage and automated night downtime schedule.
                </p>
              </div>
              {isSaved && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Daily Limit Slider */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-semibold text-slate-700">Daily Allowed Screen Time</span>
                  <span className="font-bold text-blue-700 text-sm">
                    {formatHoursMins(customLimit)} ({customLimit} mins)
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="360"
                  step="15"
                  value={customLimit}
                  onChange={(e) => setCustomLimit(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>30m (Strict)</span>
                  <span>2h 30m (Recommended)</span>
                  <span>6h (Relaxed)</span>
                </div>
              </div>

              {/* Bedtime & Downtime Schedule */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      Night Bedtime Downtime
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={screenTime.bedtimeDowntimeEnabled}
                      onChange={(e) =>
                        onUpdateSchedule({ bedtimeDowntimeEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Locks the device during bedtime hours automatically to encourage healthy sleep habits.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Moon className="w-3 h-3 text-slate-400" /> Bedtime Starts (Lock)
                    </label>
                    <input
                      type="time"
                      value={bedStart}
                      onChange={(e) => setBedStart(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Sun className="w-3 h-3 text-slate-400" /> Morning Wakeup (Unlock)
                    </label>
                    <input
                      type="time"
                      value={bedEnd}
                      onChange={(e) => setBedEnd(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSavePolicy}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Apply Screen-Time Policy
            </button>
          </div>
        </div>
      </div>

      {/* Bonus Screen-Time Requests from Child */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-slate-800 text-sm">
              Time Extension Requests from {telemetry.childName}
            </h4>
          </div>
          {pendingRequests.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {pendingRequests.length} Pending
            </span>
          )}
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            No pending time requests right now. When {telemetry.childName} taps &quot;Request More Time&quot; on their device, it will appear here for 1-click authorization.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req: BonusTimeRequest) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-900">
                      +{req.requestedMinutes} Minutes Requested
                    </span>
                    <span className="text-[11px] text-slate-500">• {req.requestedAt}</span>
                  </div>
                  <p className="text-xs text-slate-700 italic">&ldquo;{req.reason}&rdquo;</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onResolveBonusRequest(req.id, false)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5 text-slate-400" /> Decline
                  </button>
                  <button
                    onClick={() => onResolveBonusRequest(req.id, true, 15)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve +15m
                  </button>
                  <button
                    onClick={() => onResolveBonusRequest(req.id, true, req.requestedMinutes)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Grant Full +{req.requestedMinutes}m
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
