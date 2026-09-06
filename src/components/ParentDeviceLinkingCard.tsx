import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  KeyRound,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Copy,
  Check,
  Clock,
  Radio,
  CheckCircle2,
  Unlink,
  AlertCircle,
  ExternalLink,
  Lock
} from 'lucide-react';
import { DeviceTelemetry } from '../types';

interface ParentDeviceLinkingCardProps {
  telemetry: DeviceTelemetry;
  onRegenerateCode: () => void;
  onUnlinkDevice: () => void;
  onSimulateChildScan?: () => void;
}

export const ParentDeviceLinkingCard: React.FC<ParentDeviceLinkingCardProps> = ({
  telemetry,
  onRegenerateCode,
  onUnlinkDevice,
  onSimulateChildScan,
}) => {
  const pairing = telemetry.pairingDetails;
  const numericCode = pairing?.numericCode || telemetry.pairingCode || '849205';
  const isLinked = telemetry.isAuthorized && pairing?.connectionState === 'connected';

  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 mins

  // Code countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      if (pairing?.codeExpiresAt) {
        const diff = Math.max(0, Math.floor((pairing.codeExpiresAt - Date.now()) / 1000));
        setSecondsRemaining(diff);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [pairing?.codeExpiresAt]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(numericCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Format code with space e.g. "849 205"
  const formattedCode = numericCode.length === 6
    ? `${numericCode.slice(0, 3)} ${numericCode.slice(3)}`
    : numericCode;

  const qrData = pairing?.qrPayload || JSON.stringify({
    protocol: 'airdroid-parental-pair',
    pairingCode: numericCode,
    expiresAt: Date.now() + secondsRemaining * 1000,
    parentHost: 'Parent Admin Hub',
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-blue-50/40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                Secure Device Linking &amp; Pairing
              </h3>
              {isLinked ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Linked &amp; Protected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                  <Radio className="w-3.5 h-3.5 text-amber-600" />
                  Ready to Pair
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect the child device using the unique QR code or temporary 6-digit numeric pairing code.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isLinked ? (
            <button
              onClick={onUnlinkDevice}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
              title="Disconnect device to test the pairing and consent flow again"
            >
              <Unlink className="w-3.5 h-3.5" />
              Unlink / Re-Pair Device
            </button>
          ) : (
            <button
              onClick={onRegenerateCode}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate Code
            </button>
          )}
        </div>
      </div>

      {/* Main Pairing Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: Unique QR Code Box */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
          <div className="relative p-3.5 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block">
            <QRCodeSVG
              value={qrData}
              size={180}
              level="H"
              includeMargin={false}
              className="rounded-lg"
            />
            {/* Center Shield Badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-blue-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-800 mt-3 block">
            Unique Device Pairing QR Code
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
            Open the Child Companion App on <span className="font-semibold text-slate-700">{telemetry.childName}&apos;s device</span> and scan this code with the built-in scanner.
          </p>

          {onSimulateChildScan && (
            <button
              onClick={onSimulateChildScan}
              className="mt-3 text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-1"
            >
              Quick Test: Switch to Child Device &amp; Scan
            </button>
          )}
        </div>

        {/* Right Side: Temporary Numeric Pairing Code & Instructions */}
        <div className="lg:col-span-7 space-y-4">
          {/* Numeric Code Display */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-400" />
                Temporary 6-Digit Pairing Code
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Expires in <strong className="text-amber-300 font-mono">{timeFormatted}</strong>
                </span>
              </div>
            </div>

            {/* Large Digits */}
            <div className="flex items-center justify-between">
              <div className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-white drop-shadow-xs">
                {formattedCode}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={onRegenerateCode}
                  title="Generate a new temporary pairing code"
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              If your child&apos;s camera is unavailable, they can select <strong className="text-white">&quot;Enter Numeric Code&quot;</strong> on their companion app and type this code directly.
            </p>
          </div>

          {/* Linking Steps / Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className={`p-3 rounded-xl border ${isLinked ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 1</span>
              <span className="font-bold text-slate-800 block mt-0.5">Scan or Enter Code</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Child device scans QR or inputs {numericCode}.
              </p>
            </div>

            <div className={`p-3 rounded-xl border ${isLinked ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 2</span>
              <span className="font-bold text-slate-800 block mt-0.5">Informed Consent</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Child reviews safety rules &amp; grants permission.
              </p>
            </div>

            <div className={`p-3 rounded-xl border ${isLinked ? 'bg-emerald-100/70 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Step 3</span>
              <span className="font-bold text-emerald-800 block mt-0.5">Mutual Handshake</span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {isLinked ? 'Both devices verified & active!' : 'Awaiting child confirmation...'}
              </p>
            </div>
          </div>

          {/* Current Linked Device Details */}
          {isLinked && (
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">
                    {telemetry.deviceName} ({telemetry.deviceModel})
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Mutual Authorization Active &bull; {telemetry.authorizedAt}
                  </span>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-500">
                <span className="block font-semibold text-slate-700">All 6 Safety Controls Active</span>
                <span>Encrypted Connection</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
