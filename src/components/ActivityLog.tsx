import React, { useState } from 'react';
import {
  Bell,
  AlertOctagon,
  MapPin,
  Clock,
  BatteryCharging,
  Ban,
  ShieldCheck,
  CheckCheck,
  Trash2,
  Filter
} from 'lucide-react';
import { ActivityNotification, DeviceTelemetry } from '../types';

interface ActivityLogProps {
  telemetry: DeviceTelemetry;
  onMarkAllRead: () => void;
  onClearLog: () => void;
  onSelectMap?: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  telemetry,
  onMarkAllRead,
  onClearLog,
  onSelectMap,
}) => {
  const { notifications, childName } = telemetry;
  const [filterType, setFilterType] = useState<string>('all');

  const filteredNotifications = notifications.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'critical') return item.severity === 'critical' || item.type === 'sos';
    return item.type === filterType;
  });

  const getIcon = (type: ActivityNotification['type'], severity: ActivityNotification['severity']) => {
    if (type === 'sos' || severity === 'critical') {
      return (
        <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 shrink-0">
          <AlertOctagon className="w-4 h-4" />
        </div>
      );
    }
    switch (type) {
      case 'geofence':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
        );
      case 'screen_time':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'battery':
        return (
          <div className="w-8 h-8 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
            <BatteryCharging className="w-4 h-4" />
          </div>
        );
      case 'blocked_app':
      case 'blocked_web':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <Ban className="w-4 h-4" />
          </div>
        );
      case 'auth':
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            Activity &amp; Safety Notifications Log
          </h4>
          <p className="text-xs text-slate-500">
            Audit trail of real-time security events, geofence alerts, and device usage on {childName}&apos;s phone.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark read
          </button>
          <button
            onClick={onClearLog}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'critical', label: '🚨 Critical / SOS' },
          { id: 'geofence', label: '📍 Geofences' },
          { id: 'screen_time', label: '⏳ Screen Time' },
          { id: 'battery', label: '🔋 Battery' },
          { id: 'blocked_app', label: '🚫 App Blocks' },
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilterType(chip.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterType === chip.id
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Notifications Stream */}
      <div className="space-y-2.5">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No events match the selected category.
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                notif.severity === 'critical'
                  ? 'bg-rose-50/80 border-rose-300'
                  : notif.read
                  ? 'bg-white border-slate-100'
                  : 'bg-blue-50/40 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {getIcon(notif.type, notif.severity)}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        notif.severity === 'critical' ? 'text-rose-900' : 'text-slate-800'
                      }`}
                    >
                      {notif.title}
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-400 font-medium block">
                  {notif.timestamp}
                </span>
                {notif.type === 'geofence' && onSelectMap && (
                  <button
                    onClick={onSelectMap}
                    className="mt-1 text-[10px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    View Map
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
