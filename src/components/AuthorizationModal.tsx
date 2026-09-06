import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  QrCode,
  CheckCircle2,
  Lock,
  Smartphone,
  Users,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { DeviceTelemetry } from '../types';
import { ParentDeviceLinkingCard } from './ParentDeviceLinkingCard';

interface AuthorizationModalProps {
  telemetry: DeviceTelemetry;
  onUpdatePin: (newPin: string) => void;
  onRegenerateCode: () => void;
  onResetAuthorization: () => void;
  onSwitchToChildMode?: () => void;
}

export const AuthorizationModal: React.FC<AuthorizationModalProps> = ({
  telemetry,
  onUpdatePin,
  onRegenerateCode,
  onResetAuthorization,
  onSwitchToChildMode,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length === 4) {
      onUpdatePin(pinInput);
      setPinSuccess(true);
      setTimeout(() => setPinSuccess(false), 3000);
      setPinInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Device Linking System Card with QR Code and 6-Digit Temporary Code */}
      <ParentDeviceLinkingCard
        telemetry={telemetry}
        onRegenerateCode={onRegenerateCode}
        onUnlinkDevice={onResetAuthorization}
        onSimulateChildScan={onSwitchToChildMode}
      />

      {/* Authorized Permission Checklist */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h4 className="font-bold text-slate-800 text-sm mb-1">
          Consented Permission Framework
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          Both parent and child ({telemetry.childName}) agreed to these specific access levels during onboarding.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {[
            {
              title: 'Live Location & Geofence Alerts',
              desc: 'Allows parent to check real-time GPS coordinates and receive automatic arrival/departure pings.',
              status: 'Approved by Child & Parent',
            },
            {
              title: 'Screen Time & Sleep Downtime',
              desc: 'Enforces daily maximum screen allowances and overnight device pause for rest.',
              status: 'Approved by Child & Parent',
            },
            {
              title: 'App Usage Metrics & Selective Blocking',
              desc: 'Monitors total hours spent in games and locks age-inappropriate applications.',
              status: 'Approved by Child & Parent',
            },
            {
              title: 'Safe Web Filtering & SafeSearch',
              desc: 'Filters adult sites, gambling, violent domains, and malicious phishing links.',
              status: 'Approved by Child & Parent',
            },
            {
              title: 'Battery & Device Health Diagnostics',
              desc: 'Alerts parent if battery is critically low (<15%) or disconnected from network.',
              status: 'Approved by Child & Parent',
            },
            {
              title: 'Emergency SOS Broadcast',
              desc: 'Child can broadcast an emergency alert with 1-tap priority push to parent.',
              status: 'Approved by Child & Parent',
            },
          ].map((perm, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block text-xs">{perm.title}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">{perm.desc}</p>
                <span className="inline-block text-[10px] font-bold text-emerald-700 mt-1">
                  {perm.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parent Security PIN Protection */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-slate-800 text-sm">Parent Dashboard Security PIN</h4>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          This 4-digit master PIN prevents the child from altering restrictions or exiting parental control mode on their device.
        </p>

        <form onSubmit={handleSavePin} className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="password"
              maxLength={4}
              placeholder="•••• (Current: 1234)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              className="w-44 text-center tracking-widest font-mono text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={pinInput.length !== 4}
            className="px-4 py-2 bg-blue-600 disabled:opacity-50 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Update PIN
          </button>
          {pinSuccess && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> PIN successfully updated!
            </span>
          )}
        </form>
      </div>
    </div>
  );
};
