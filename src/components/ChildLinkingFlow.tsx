import React, { useState, useEffect } from 'react';
import {
  QrCode,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Check,
  AlertCircle,
  Camera,
  Flashlight,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  Eye,
  MapPin,
  Clock,
  Smartphone,
  Globe,
  BatteryCharging,
  AlertOctagon,
  RefreshCw
} from 'lucide-react';
import { DeviceTelemetry, ConsentPermissions } from '../types';

interface ChildLinkingFlowProps {
  telemetry: DeviceTelemetry;
  onCompletePairing: (consent: ConsentPermissions) => void;
  onCancel?: () => void;
}

export const ChildLinkingFlow: React.FC<ChildLinkingFlowProps> = ({
  telemetry,
  onCompletePairing,
  onCancel,
}) => {
  const pairing = telemetry.pairingDetails;
  const targetCode = pairing?.numericCode || telemetry.pairingCode || '849205';

  // Step 1: 'code_entry' (QR or Numeric), Step 2: 'permission_consent', Step 3: 'connected_confirmed'
  const [step, setStep] = useState<'method_selection' | 'permission_consent' | 'connected_confirmed'>('method_selection');
  const [method, setMethod] = useState<'qr' | 'numeric'>('qr');

  // QR Scanner Simulator
  const [isScanning, setIsScanning] = useState(true);
  const [scanLaserPos, setScanLaserPos] = useState(0);
  const [flashlightOn, setFlashlightOn] = useState(false);

  // Numeric Code Input (6 digits)
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Permission & Consent
  const [consentPermissions, setConsentPermissions] = useState<ConsentPermissions>({
    locationSharing: true,
    screenTimeLimits: true,
    appUsageMonitoring: true,
    webRestrictions: true,
    batteryDiagnostics: true,
    sosBroadcast: true,
    consentAgreedByChild: false,
    consentAgreedAt: undefined,
  });

  // Animated laser line in QR scanner
  useEffect(() => {
    if (method === 'qr' && isScanning) {
      const interval = setInterval(() => {
        setScanLaserPos((prev) => (prev >= 90 ? 5 : prev + 5));
      }, 70);
      return () => clearInterval(interval);
    }
  }, [method, isScanning]);

  // Handle digit inputs
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);
    setCodeError(null);

    // Auto-advance
    if (clean && index < 5) {
      const nextInput = document.getElementById(`digit-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`digit-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleAutoFillCode = () => {
    const chars = targetCode.slice(0, 6).split('');
    setDigits(chars);
    setCodeError(null);
  };

  // Verify numeric code
  const handleVerifyNumericCode = () => {
    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setCodeError('Please enter all 6 digits of the pairing code.');
      return;
    }

    if (fullCode === targetCode) {
      // Valid! Proceed to Permission & Consent Screen
      setCodeError(null);
      setStep('permission_consent');
    } else {
      setCodeError(`Invalid pairing code. Expected code displayed on parent screen (${targetCode.slice(0, 3)} ${targetCode.slice(3)}).`);
    }
  };

  // Trigger QR Scan detection
  const handleSimulateScanSuccess = () => {
    setIsScanning(false);
    setTimeout(() => {
      setStep('permission_consent');
    }, 400);
  };

  // Submit Consent & Confirm Connection
  const handleConfirmConsent = () => {
    if (!consentPermissions.consentAgreedByChild) return;

    const finalConsent: ConsentPermissions = {
      ...consentPermissions,
      consentAgreedByChild: true,
      consentAgreedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConsentPermissions(finalConsent);
    setStep('connected_confirmed');

    // Notify parent & persist
    onCompletePairing(finalConsent);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      {/* Top Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">AirDroid Device Linking</h4>
            <span className="text-[10px] text-slate-500">Child Companion Pairing</span>
          </div>
        </div>

        {onCancel && step !== 'connected_confirmed' && (
          <button
            onClick={onCancel}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        )}
      </div>

      {/* STEP 1: Method Selection (Scan QR or Enter Numeric Code) */}
      {step === 'method_selection' && (
        <div className="flex-1 p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-sm">Connect with Parent Device</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan the QR code or type the 6-digit temporary code shown on your parent&apos;s dashboard.
              </p>
            </div>

            {/* Toggle Tabs: Scan QR vs Enter Code */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setMethod('qr')}
                className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  method === 'qr'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Scan QR Code
              </button>
              <button
                onClick={() => setMethod('numeric')}
                className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  method === 'numeric'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Enter 6-Digit Code
              </button>
            </div>

            {method === 'qr' ? (
              /* QR Scanner Simulator */
              <div className="space-y-3">
                <div className="relative w-full aspect-square max-w-[260px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-inner flex items-center justify-center">
                  {/* Grid pattern */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
                      backgroundSize: '16px 16px',
                    }}
                  />

                  {/* Corner Reticle Brackets */}
                  <div className="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />

                  {/* Animated Laser Scanning Line */}
                  <div
                    style={{ top: `${scanLaserPos}%` }}
                    className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] transition-all duration-75"
                  />

                  {/* Center hint text */}
                  <div className="text-center px-4 pointer-events-none z-10">
                    <QrCode className="w-10 h-10 text-white/70 mx-auto mb-1 animate-pulse" />
                    <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider block">
                      Align QR in viewfinder
                    </span>
                  </div>

                  {/* Flashlight toggle */}
                  <button
                    onClick={() => setFlashlightOn(!flashlightOn)}
                    className={`absolute bottom-2.5 right-2.5 p-2 rounded-xl text-xs transition-colors ${
                      flashlightOn ? 'bg-amber-400 text-slate-900' : 'bg-white/20 text-white'
                    }`}
                    title="Toggle flashlight"
                  >
                    <Flashlight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-[11px] text-slate-500">
                    Point this camera at the QR code displayed on the Parent Dashboard screen.
                  </p>

                  <button
                    id="btn-simulate-qr-scan"
                    onClick={handleSimulateScanSuccess}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Scan Parent QR Code
                  </button>
                </div>
              </div>
            ) : (
              /* Numeric 6-Digit Code Entry */
              <div className="space-y-4 pt-1">
                <div className="text-center">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Enter Temporary Pairing Code
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Parent Code: <strong className="text-slate-600 font-mono">{targetCode.slice(0, 3)} {targetCode.slice(3)}</strong>
                  </span>
                </div>

                {/* 6 Digit Input Boxes */}
                <div className="flex justify-center gap-1.5">
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`digit-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={`w-10 h-12 text-center text-lg font-bold font-mono rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        digit
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    />
                  ))}
                </div>

                {codeError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                    <span>{codeError}</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleAutoFillCode}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
                  >
                    Auto-Fill Parent&apos;s Code ({targetCode})
                  </button>
                </div>

                <button
                  onClick={handleVerifyNumericCode}
                  disabled={digits.join('').length !== 6}
                  className="w-full py-2.5 bg-blue-600 disabled:opacity-40 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  Verify Code &amp; Continue
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 block">Mutual Security Handshake</span>
            <span className="text-[11px] text-slate-600 font-medium">
              Requires child agreement in the next step before connection is finalized.
            </span>
          </div>
        </div>
      )}

      {/* STEP 2: Permission & Consent Screen (Required Before Linking) */}
      {step === 'permission_consent' && (
        <div className="flex-1 p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Header */}
            <div>
              <button
                onClick={() => setStep('method_selection')}
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 mb-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Pairing Code
              </button>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Permission &amp; Consent Screen
                </h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Required
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Before linking, please review the safety features that will be active on this device:
              </p>
            </div>

            {/* Itemized Permissions List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {[
                {
                  icon: <MapPin className="w-4 h-4 text-rose-500" />,
                  title: 'Live Location Sharing',
                  desc: 'Shares GPS position and safe zone arrival/departure alerts (Home, School).',
                },
                {
                  icon: <Clock className="w-4 h-4 text-blue-500" />,
                  title: 'Screen Time & Bedtime Downtime',
                  desc: 'Applies daily limits and pauses non-essential apps during bedtime rest.',
                },
                {
                  icon: <Smartphone className="w-4 h-4 text-purple-500" />,
                  title: 'App Usage & Distraction Blocking',
                  desc: 'Measures hours spent on games/social apps and locks restricted apps.',
                },
                {
                  icon: <Globe className="w-4 h-4 text-emerald-500" />,
                  title: 'Safe Web Filtering & SafeSearch',
                  desc: 'Blocks explicit, gambling, violent websites, and enables SafeSearch.',
                },
                {
                  icon: <BatteryCharging className="w-4 h-4 text-amber-500" />,
                  title: 'Battery Diagnostics & Status',
                  desc: 'Alerts your parent when device battery drops below 15%.',
                },
                {
                  icon: <AlertOctagon className="w-4 h-4 text-rose-600" />,
                  title: 'Emergency SOS Broadcast',
                  desc: 'Gives you an instant 1-tap SOS distress button to notify parents immediately.',
                },
              ].map((perm, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5 text-xs"
                >
                  <div className="p-1.5 rounded-lg bg-white shadow-2xs shrink-0 mt-0.5">
                    {perm.icon}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">{perm.title}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{perm.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Privacy Box */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px]">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                What Stays 100% Private:
              </div>
              <p className="text-[10px] text-blue-800 leading-tight">
                Your private chat messages, account passwords, and personal photo albums are never monitored, keylogged, or shared with anyone.
              </p>
            </div>

            {/* Child Consent Agreement Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-blue-200 bg-blue-50/40 cursor-pointer text-xs select-none">
              <input
                id="checkbox-child-consent"
                type="checkbox"
                checked={consentPermissions.consentAgreedByChild}
                onChange={(e) =>
                  setConsentPermissions((prev) => ({
                    ...prev,
                    consentAgreedByChild: e.target.checked,
                  }))
                }
                className="mt-0.5 w-4 h-4 rounded text-blue-600 accent-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] font-semibold text-slate-800 leading-tight">
                I ({telemetry.childName}) have reviewed and consent to these parental controls on my device.
              </span>
            </label>
          </div>

          {/* Action: Confirm & Connect */}
          <div>
            <button
              id="btn-confirm-child-consent"
              onClick={handleConfirmConsent}
              disabled={!consentPermissions.consentAgreedByChild}
              className="w-full py-3 bg-emerald-600 disabled:opacity-40 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm &amp; Connect to Parent Device
            </button>
            {!consentPermissions.consentAgreedByChild && (
              <span className="text-[10px] text-slate-400 text-center block mt-1">
                Please check the consent box above to establish connection
              </span>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Connection Confirmed Screen (Both Devices Confirm Success) */}
      {step === 'connected_confirmed' && (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border-2 border-emerald-300 flex items-center justify-center shadow-lg animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Handshake Complete
            </span>
            <h3 className="font-extrabold text-slate-900 text-lg">
              Device Linked Successfully!
            </h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Your device is now securely paired with <strong className="text-slate-700">Parent Admin Hub</strong>.
            </p>
          </div>

          <div className="w-full max-w-xs p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-left space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 text-[11px]">Connection Status:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Active &bull; Encrypted
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Child Device:</span>
              <span className="font-semibold text-slate-800">{telemetry.deviceName}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Consented At:</span>
              <span className="font-semibold text-slate-800">
                {consentPermissions.consentAgreedAt || 'Just now'}
              </span>
            </div>
          </div>

          <div className="w-full max-w-xs pt-2">
            <button
              id="btn-finish-child-linking"
              onClick={onCancel}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-colors"
            >
              Continue to Child Device
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
