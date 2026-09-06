import React, { useState } from 'react';
import {
  Gamepad2,
  Video,
  Languages,
  Globe,
  Box,
  Headphones,
  Ban,
  CheckCircle,
  Clock,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { AppUsageItem, AppCategory, DeviceTelemetry } from '../types';

interface AppManagerProps {
  telemetry: DeviceTelemetry;
  onToggleBlock: (appId: string) => void;
  onSetTimeLimit: (appId: string, limitMinutes: number | null) => void;
}

export const AppManager: React.FC<AppManagerProps> = ({
  telemetry,
  onToggleBlock,
  onSetTimeLimit,
}) => {
  const { apps } = telemetry;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingLimitAppId, setEditingLimitAppId] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState<number>(30);

  const getAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'youtube':
      case 'video':
        return <Video className="w-5 h-5 text-rose-600" />;
      case 'gamepad-2':
        return <Gamepad2 className="w-5 h-5 text-purple-600" />;
      case 'languages':
        return <Languages className="w-5 h-5 text-emerald-600" />;
      case 'globe':
        return <Globe className="w-5 h-5 text-blue-600" />;
      case 'box':
        return <Box className="w-5 h-5 text-amber-600" />;
      case 'headphones':
        return <Headphones className="w-5 h-5 text-cyan-600" />;
      default:
        return <Globe className="w-5 h-5 text-slate-600" />;
    }
  };

  // Category usage breakdown
  const categoryTotals: Record<AppCategory, number> = {
    Games: 0,
    Social: 0,
    Entertainment: 0,
    Education: 0,
    Utility: 0,
  };

  apps.forEach((a) => {
    if (categoryTotals[a.category] !== undefined) {
      categoryTotals[a.category] += a.usageMinutesToday;
    }
  });

  const totalAppMinutes = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveLimit = (appId: string) => {
    onSetTimeLimit(appId, tempLimit === 0 ? null : tempLimit);
    setEditingLimitAppId(null);
  };

  return (
    <div className="space-y-6">
      {/* Category Usage Breakdown Cards */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h4 className="font-bold text-slate-800 text-sm mb-3">App Activity by Category Today</h4>

        {/* Multi-segmented bar */}
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 mb-4">
          <div
            style={{ width: `${(categoryTotals.Games / totalAppMinutes) * 100}%` }}
            className="bg-purple-500 h-full"
            title={`Games: ${categoryTotals.Games}m`}
          />
          <div
            style={{ width: `${(categoryTotals.Entertainment / totalAppMinutes) * 100}%` }}
            className="bg-rose-500 h-full"
            title={`Entertainment: ${categoryTotals.Entertainment}m`}
          />
          <div
            style={{ width: `${(categoryTotals.Education / totalAppMinutes) * 100}%` }}
            className="bg-emerald-500 h-full"
            title={`Education: ${categoryTotals.Education}m`}
          />
          <div
            style={{ width: `${(categoryTotals.Utility / totalAppMinutes) * 100}%` }}
            className="bg-blue-500 h-full"
            title={`Utility: ${categoryTotals.Utility}m`}
          />
          <div
            style={{ width: `${(categoryTotals.Social / totalAppMinutes) * 100}%` }}
            className="bg-amber-500 h-full"
            title={`Social: ${categoryTotals.Social}m`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
            <div>
              <span className="text-slate-500 block">Games</span>
              <span className="font-bold text-slate-800">{categoryTotals.Games} mins</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
            <div>
              <span className="text-slate-500 block">Entertainment</span>
              <span className="font-bold text-slate-800">{categoryTotals.Entertainment} mins</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <span className="text-slate-500 block">Education</span>
              <span className="font-bold text-slate-800">{categoryTotals.Education} mins</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
            <div>
              <span className="text-slate-500 block">Utility</span>
              <span className="font-bold text-slate-800">{categoryTotals.Utility} mins</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
            <div>
              <span className="text-slate-500 block">Social</span>
              <span className="font-bold text-slate-800">{categoryTotals.Social} mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* App List with Search & Filtering */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Installed Apps & Usage Limits</h4>
            <p className="text-xs text-slate-500">
              Block distracting apps completely or assign per-app daily time caps.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 text-xs">
          {['All', 'Games', 'Entertainment', 'Education', 'Social', 'Utility'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* App Rows */}
        <div className="space-y-3">
          {filteredApps.map((app) => {
            const isLimitReached =
              app.timeLimitMinutes !== null && app.usageMinutesToday >= app.timeLimitMinutes;

            return (
              <div
                key={app.id}
                className={`p-4 rounded-xl border transition-colors flex flex-wrap items-center justify-between gap-3 ${
                  app.isBlocked
                    ? 'bg-rose-50/60 border-rose-200'
                    : isLimitReached
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* App Info */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    {getAppIcon(app.iconName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">{app.name}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {app.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{app.usageMinutesToday} min today</span>
                      <span>•</span>
                      <span>Opened {app.launchCountToday}x</span>
                      <span>•</span>
                      <span>Last: {app.lastUsed}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badges & Limit Info */}
                <div className="flex items-center gap-3">
                  {app.isBlocked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                      <Ban className="w-3.5 h-3.5" /> Blocked by Parent
                    </span>
                  ) : isLimitReached ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" /> Daily Limit Hit ({app.timeLimitMinutes}m)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Allowed
                    </span>
                  )}

                  {/* Limit Button */}
                  <button
                    onClick={() => {
                      setEditingLimitAppId(app.id);
                      setTempLimit(app.timeLimitMinutes || 45);
                    }}
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {app.timeLimitMinutes ? `${app.timeLimitMinutes}m limit` : 'No limit'}
                  </button>

                  {/* Instant Block Switch */}
                  <button
                    onClick={() => onToggleBlock(app.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      app.isBlocked
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {app.isBlocked ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Unblock
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" /> Block App
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit App Limit Modal */}
      {editingLimitAppId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm mb-1">Set Daily App Time Limit</h4>
            <p className="text-xs text-slate-500 mb-4">
              When time runs out, the child cannot open this app until tomorrow unless approved.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600">Daily Cap:</span>
                <span className="font-bold text-blue-600 text-sm">
                  {tempLimit === 0 ? 'No Limit (Unlimited)' : `${tempLimit} minutes`}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="180"
                step="15"
                value={tempLimit}
                onChange={(e) => setTempLimit(Number(e.target.value))}
                className="w-full accent-blue-600"
              />

              <div className="grid grid-cols-4 gap-2 text-xs">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setTempLimit(mins)}
                    className="py-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingLimitAppId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveLimit(editingLimitAppId)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Save Limit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
