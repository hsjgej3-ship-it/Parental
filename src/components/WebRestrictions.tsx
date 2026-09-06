import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Globe,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lock
} from 'lucide-react';
import { DeviceTelemetry } from '../types';

interface WebRestrictionsProps {
  telemetry: DeviceTelemetry;
  onToggleCategory: (categoryId: string) => void;
  onAddCustomRule: (domain: string, action: 'block' | 'allow') => void;
  onRemoveCustomRule: (ruleId: string) => void;
}

export const WebRestrictions: React.FC<WebRestrictionsProps> = ({
  telemetry,
  onToggleCategory,
  onAddCustomRule,
  onRemoveCustomRule,
}) => {
  const { webCategories, webCustomRules } = telemetry;
  const [newDomain, setNewDomain] = useState('');
  const [newAction, setNewAction] = useState<'block' | 'allow'>('block');
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<{
    status: 'allowed' | 'blocked';
    reason: string;
  } | null>(null);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    const cleanDomain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    onAddCustomRule(cleanDomain, newAction);
    setNewDomain('');
  };

  const handleTestUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl.trim()) return;

    const normalized = testUrl.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    // Check custom rules first
    const customMatch = webCustomRules.find((r) => normalized.includes(r.domain) || r.domain.includes(normalized));
    if (customMatch) {
      if (customMatch.action === 'block') {
        setTestResult({
          status: 'blocked',
          reason: `Blocked by Custom Blacklist Rule: "${customMatch.domain}"`,
        });
        return;
      } else {
        setTestResult({
          status: 'allowed',
          reason: `Explicitly Allowed by Parent Whitelist: "${customMatch.domain}"`,
        });
        return;
      }
    }

    // Check categories
    for (const cat of webCategories) {
      if (cat.isBlocked) {
        if (cat.sampleSites.some((s) => normalized.includes(s) || s.includes(normalized))) {
          setTestResult({
            status: 'blocked',
            reason: `Blocked by Category Filter: ${cat.name}`,
          });
          return;
        }
        if (cat.id === 'cat-adult' && (normalized.includes('adult') || normalized.includes('porn') || normalized.includes('xxx'))) {
          setTestResult({
            status: 'blocked',
            reason: `Blocked by Filter: Adult & Explicit Content`,
          });
          return;
        }
        if (cat.id === 'cat-gambling' && (normalized.includes('casino') || normalized.includes('bet') || normalized.includes('poker'))) {
          setTestResult({
            status: 'blocked',
            reason: `Blocked by Filter: Gambling & Betting`,
          });
          return;
        }
      }
    }

    setTestResult({
      status: 'allowed',
      reason: `Safe Web Page. Passes all active parental control filters and Google SafeSearch enforcement.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: SafeSearch & Guard */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              SafeSearch &amp; Content Guard Active
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Strict Safe Mode
              </span>
            </h3>
            <p className="text-xs text-slate-600">
              Filters mature search results, enforces HTTPS protection, and blocks malicious web downloads on {telemetry.childName}&apos;s device.
            </p>
          </div>
        </div>
      </div>

      {/* Category Toggles Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h4 className="font-bold text-slate-800 text-sm mb-1">Web Content Category Restrictions</h4>
        <p className="text-xs text-slate-500 mb-4">
          Enable or disable high-level category filters that analyze domains and page keywords in real time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {webCategories.map((cat) => (
            <div
              key={cat.id}
              className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                cat.isBlocked ? 'bg-slate-50/70 border-slate-200' : 'bg-white border-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-xs">{cat.name}</span>
                  {cat.isBlocked ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      Blocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Allowed
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">{cat.description}</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={cat.isBlocked}
                  onChange={() => onToggleCategory(cat.id)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Live Policy URL Tester */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h4 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" />
          Test Website URL Restriction
        </h4>
        <p className="text-xs text-slate-500 mb-3">
          Check whether any URL will be allowed or blocked on {telemetry.childName}&apos;s device before they visit.
        </p>

        <form onSubmit={handleTestUrl} className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="e.g., discord.com, khanacademy.org, adult-sites.com, roblox.com"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Check URL
          </button>
        </form>

        {testResult && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
              testResult.status === 'blocked'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {testResult.status === 'blocked' ? (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {testResult.status === 'blocked' ? 'ACCESS DENIED' : 'ACCESS PERMITTED'}
              </p>
              <p className="text-[11px] mt-0.5">{testResult.reason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Custom Blacklist & Whitelist Management */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h4 className="font-bold text-slate-800 text-sm mb-1">Custom Website Rules (Blacklist & Whitelist)</h4>
        <p className="text-xs text-slate-500 mb-4">
          Explicitly block specific websites or whitelist educational platforms.
        </p>

        {/* Add Rule Form */}
        <form onSubmit={handleAddRule} className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="domain.com (e.g. reddit.com)"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="flex-1 min-w-[200px] text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            value={newAction}
            onChange={(e) => setNewAction(e.target.value as 'block' | 'allow')}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="block">Block Always (Blacklist)</option>
            <option value="allow">Allow Always (Whitelist)</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Rule
          </button>
        </form>

        {/* Rules Table */}
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {webCustomRules.map((rule) => (
            <div
              key={rule.id}
              className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-800">{rule.domain}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    rule.action === 'block'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {rule.action === 'block' ? 'Always Blocked' : 'Always Allowed'}
                </span>
                <span className="text-[10px] text-slate-400">Added {rule.addedAt}</span>
              </div>
              <button
                onClick={() => onRemoveCustomRule(rule.id)}
                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                title="Remove rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
