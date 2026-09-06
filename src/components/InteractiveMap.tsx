import React, { useState } from 'react';
import {
  MapPin,
  Shield,
  Compass,
  Plus,
  Trash2,
  Navigation,
  Crosshair,
  AlertTriangle,
  Layers,
  School,
  Home,
  TreePine,
  Maximize2
} from 'lucide-react';
import { LocationPoint, GeofenceZone, DeviceTelemetry } from '../types';

interface InteractiveMapProps {
  telemetry: DeviceTelemetry;
  onUpdateLocation: (newLocation: LocationPoint) => void;
  onAddGeofence: (zone: GeofenceZone) => void;
  onRemoveGeofence: (id: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  telemetry,
  onUpdateLocation,
  onAddGeofence,
  onRemoveGeofence,
}) => {
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');
  const [showHistory, setShowHistory] = useState<boolean>(true);
  const [showGeofenceModal, setShowGeofenceModal] = useState<boolean>(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneType, setNewZoneType] = useState<'home' | 'school' | 'park' | 'custom'>('custom');
  const [newZoneRadius, setNewZoneRadius] = useState<number>(200);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);

  // Map coordinates projection for a 600x420 SVG viewport
  // Base origin center: lat 37.775, lng -122.418
  const centerLat = 37.775;
  const centerLng = -122.418;
  const scale = 14000; // SVG pixels per degree

  const projectToSvg = (lat: number, lng: number) => {
    const x = 300 + (lng - centerLng) * scale;
    const y = 210 - (lat - centerLat) * scale;
    return { x: Math.max(30, Math.min(570, x)), y: Math.max(30, Math.min(390, y)) };
  };

  const childPos = projectToSvg(telemetry.currentLocation.lat, telemetry.currentLocation.lng);

  // Check which geofence the child is currently inside
  const currentZone = telemetry.geofences.find((g) => {
    // approx distance calculation
    const dLat = (telemetry.currentLocation.lat - g.lat) * 111000;
    const dLng = (telemetry.currentLocation.lng - g.lng) * 88000;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    return dist <= g.radiusMeters;
  });

  const handleBrowserGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const newPoint: LocationPoint = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          timestamp: 'Just now (Real GPS)',
          address: `Live GPS: ${pos.coords.latitude.toFixed(4)}°, ${pos.coords.longitude.toFixed(4)}° (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`,
          speedKmh: Math.round((pos.coords.speed || 0) * 3.6),
        };
        onUpdateLocation(newPoint);
        setLocationSuccessMsg('Device position updated via authorized GPS!');
        setTimeout(() => setLocationSuccessMsg(null), 4000);
      },
      (err) => {
        setIsLocating(false);
        // Fallback simulation if permission denied in iframe
        const simulatedPoint: LocationPoint = {
          lat: 37.7749,
          lng: -122.4194,
          timestamp: 'Just now (Simulated)',
          address: '420 Market St, Financial District (Home)',
          speedKmh: 0,
        };
        onUpdateLocation(simulatedPoint);
        setLocationSuccessMsg('Updated to child home location (Browser GPS: ' + err.message + ')');
        setTimeout(() => setLocationSuccessMsg(null), 4000);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const simulateLocationMove = (destination: 'home' | 'school' | 'park' | 'transit') => {
    let point: LocationPoint;
    if (destination === 'home') {
      point = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: 'Just now',
        address: '420 Market St, San Francisco, CA (Home Safe Zone)',
        speedKmh: 0,
      };
    } else if (destination === 'school') {
      point = {
        lat: 37.7812,
        lng: -122.411,
        timestamp: 'Just now',
        address: 'Oak Ridge Elementary, SF, CA (School Safe Zone)',
        speedKmh: 0,
      };
    } else if (destination === 'park') {
      point = {
        lat: 37.7685,
        lng: -122.428,
        timestamp: 'Just now',
        address: 'Lincoln Community Park Playground',
        speedKmh: 4,
      };
    } else {
      point = {
        lat: 37.778,
        lng: -122.415,
        timestamp: 'Just now',
        address: 'Market & 6th St (In Transit / Bus)',
        speedKmh: 24,
      };
    }
    onUpdateLocation(point);
    setLocationSuccessMsg(`Child moved to ${point.address.split(',')[0]}`);
    setTimeout(() => setLocationSuccessMsg(null), 3500);
  };

  const handleCreateGeofence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    const newZone: GeofenceZone = {
      id: `geo-${Date.now()}`,
      name: newZoneName.trim(),
      lat: telemetry.currentLocation.lat,
      lng: telemetry.currentLocation.lng,
      radiusMeters: newZoneRadius,
      alertOnEnter: true,
      alertOnExit: true,
      type: newZoneType,
    };
    onAddGeofence(newZone);
    setNewZoneName('');
    setShowGeofenceModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Location Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 text-base">
                {telemetry.childName}&apos;s Live Location
              </h3>
              {currentZone ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  Inside {currentZone.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Outside Safe Zones
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {telemetry.currentLocation.address} • Updated {telemetry.currentLocation.timestamp}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-real-gps"
            onClick={handleBrowserGeolocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Locating...' : 'Query Device GPS'}
          </button>
          <button
            id="btn-add-geofence"
            onClick={() => setShowGeofenceModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Safe Zone
          </button>
        </div>
      </div>

      {locationSuccessMsg && (
        <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 animate-fadeIn">
          <Shield className="w-4 h-4 text-emerald-600" />
          {locationSuccessMsg}
        </div>
      )}

      {/* Main Vector Map Display */}
      <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-300 shadow-md">
        {/* Map Control Bar Overlay */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-xs px-2 py-1.5 rounded-lg shadow-xs border border-slate-200 text-xs">
          <button
            onClick={() => setMapStyle(mapStyle === 'street' ? 'satellite' : 'street')}
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-700 hover:bg-slate-100 font-medium"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            {mapStyle === 'street' ? 'Street View' : 'Satellite'}
          </button>
          <span className="w-px h-3 bg-slate-200" />
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1 px-2 py-1 rounded font-medium ${
              showHistory ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Route History
          </button>
        </div>

        {/* Speed / Battery Telemetry Overlay */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs border border-slate-700">
          <div className="flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Speed: {telemetry.currentLocation.speedKmh} km/h</span>
          </div>
          <span className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Encrypted Link</span>
          </div>
        </div>

        {/* SVG Interactive Canvas */}
        <svg
          viewBox="0 0 600 420"
          className={`w-full h-80 sm:h-96 select-none transition-colors duration-300 ${
            mapStyle === 'satellite' ? 'bg-[#1b263b]' : 'bg-[#e9ecef]'
          }`}
        >
          {/* Defs for gradients & patterns */}
          <defs>
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke={mapStyle === 'satellite' ? '#253549' : '#dee2e6'}
                strokeWidth="1"
              />
            </pattern>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.9" />
            </linearGradient>
            <radialGradient id="pulseGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect width="600" height="420" fill="url(#gridPattern)" />

          {/* City Geographic Blocks & Features */}
          {/* River / Bay section */}
          <path
            d="M 0 350 Q 150 330 300 370 T 600 360 L 600 420 L 0 420 Z"
            fill={mapStyle === 'satellite' ? '#0d1b2a' : '#cce3de'}
          />

          {/* Park area */}
          <rect
            x="70"
            y="260"
            width="130"
            height="100"
            rx="8"
            fill={mapStyle === 'satellite' ? '#1c3a27' : '#d8f3dc'}
            stroke={mapStyle === 'satellite' ? '#2d5a3c' : '#b7e4c7'}
            strokeWidth="1.5"
          />
          <text
            x="135"
            y="315"
            fontSize="10"
            fontWeight="bold"
            fill={mapStyle === 'satellite' ? '#a3cfbb' : '#2d6a4f'}
            textAnchor="middle"
          >
            Lincoln Park
          </text>

          {/* School Grounds area */}
          <rect
            x="360"
            y="50"
            width="150"
            height="110"
            rx="8"
            fill={mapStyle === 'satellite' ? '#332b1f' : '#fefae0'}
            stroke={mapStyle === 'satellite' ? '#594a32' : '#faedcd'}
            strokeWidth="1.5"
          />
          <text
            x="435"
            y="110"
            fontSize="10"
            fontWeight="bold"
            fill={mapStyle === 'satellite' ? '#e9c46a' : '#d4a373'}
            textAnchor="middle"
          >
            Oak Ridge School
          </text>

          {/* Major Roads & Avenues */}
          <path
            d="M 50 200 L 550 200"
            stroke={mapStyle === 'satellite' ? '#415a77' : '#ffffff'}
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 50 200 L 550 200"
            stroke={mapStyle === 'satellite' ? '#778da9' : '#e0e1dd'}
            strokeWidth="2"
            strokeDasharray="8 6"
          />
          <text
            x="300"
            y="196"
            fontSize="9"
            fill={mapStyle === 'satellite' ? '#cbd5e1' : '#64748b'}
            textAnchor="middle"
            fontWeight="600"
          >
            MARKET BOULEVARD
          </text>

          <path
            d="M 230 40 L 230 380"
            stroke={mapStyle === 'satellite' ? '#415a77' : '#ffffff'}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 410 40 L 410 380"
            stroke={mapStyle === 'satellite' ? '#415a77' : '#ffffff'}
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Geofence Safe Zones (Rings) */}
          {telemetry.geofences.map((zone) => {
            const pos = projectToSvg(zone.lat, zone.lng);
            const radiusSvg = (zone.radiusMeters / 1000) * (scale / 111);

            let strokeColor = '#3b82f6';
            let fillColor = 'rgba(59, 130, 246, 0.15)';
            if (zone.type === 'home') {
              strokeColor = '#10b981';
              fillColor = 'rgba(16, 185, 129, 0.15)';
            } else if (zone.type === 'school') {
              strokeColor = '#f59e0b';
              fillColor = 'rgba(245, 158, 11, 0.15)';
            }

            return (
              <g key={zone.id}>
                {/* Geofence boundary circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={Math.max(25, radiusSvg)}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                {/* Zone center pin */}
                <circle cx={pos.x} cy={pos.y} r="6" fill={strokeColor} />
                <circle cx={pos.x} cy={pos.y} r="2.5" fill="#ffffff" />
                <text
                  x={pos.x}
                  y={pos.y - Math.max(25, radiusSvg) - 5}
                  fontSize="10"
                  fontWeight="bold"
                  fill={strokeColor}
                  textAnchor="middle"
                  className="drop-shadow-xs"
                >
                  {zone.name}
                </text>
              </g>
            );
          })}

          {/* Route History Breadcrumb Path */}
          {showHistory && telemetry.locationHistory.length > 1 && (
            <g>
              <polyline
                points={telemetry.locationHistory
                  .map((pt) => {
                    const p = projectToSvg(pt.lat, pt.lng);
                    return `${p.x},${p.y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="4"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
              {telemetry.locationHistory.map((pt, idx) => {
                const p = projectToSvg(pt.lat, pt.lng);
                return (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#64748b" stroke="#ffffff" strokeWidth="1.5" />
                    <text
                      x={p.x + 6}
                      y={p.y + 3}
                      fontSize="9"
                      fill={mapStyle === 'satellite' ? '#94a3b8' : '#475569'}
                      fontWeight="500"
                    >
                      {pt.timestamp}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Live Child Position Pulse & Marker */}
          <g transform={`translate(${childPos.x}, ${childPos.y})`}>
            {/* Animated Radar Ripples */}
            <circle cx="0" cy="0" r="28" fill="url(#pulseGlow)">
              <animate attributeName="r" values="14;34;14" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="14" fill="rgba(37, 99, 235, 0.3)" />

            {/* Solid Child Pin */}
            <circle cx="0" cy="0" r="8" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="3.5" fill="#ffffff" />

            {/* Child Label Card Floating */}
            <g transform="translate(0, -18)">
              <rect
                x="-40"
                y="-18"
                width="80"
                height="18"
                rx="4"
                fill="#1e293b"
                stroke="#3b82f6"
                strokeWidth="1"
              />
              <text x="0" y="-6" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                {telemetry.childName}
              </text>
            </g>
          </g>
        </svg>

        {/* Quick Location Simulator Buttons (Bottom bar on map) */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            Test Location Simulation:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => simulateLocationMove('home')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors flex items-center gap-1"
            >
              <Home className="w-3 h-3 text-emerald-400" />
              Move to Home
            </button>
            <button
              onClick={() => simulateLocationMove('school')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors flex items-center gap-1"
            >
              <School className="w-3 h-3 text-amber-400" />
              Move to School
            </button>
            <button
              onClick={() => simulateLocationMove('park')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors flex items-center gap-1"
            >
              <TreePine className="w-3 h-3 text-green-400" />
              Move to Park
            </button>
            <button
              onClick={() => simulateLocationMove('transit')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors flex items-center gap-1"
            >
              <Navigation className="w-3 h-3 text-blue-400" />
              In Transit
            </button>
          </div>
        </div>
      </div>

      {/* Geofence List & Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Configured Safe Geofences</h4>
            <p className="text-xs text-slate-500">
              Parents receive instant push alerts whenever {telemetry.childName} enters or leaves these boundaries.
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {telemetry.geofences.length} Active Zones
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {telemetry.geofences.map((zone) => (
            <div
              key={zone.id}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {zone.type === 'home' ? (
                      <Home className="w-4 h-4 text-emerald-600" />
                    ) : zone.type === 'school' ? (
                      <School className="w-4 h-4 text-amber-600" />
                    ) : (
                      <TreePine className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="font-medium text-slate-800 text-sm">{zone.name}</span>
                  </div>
                  <button
                    onClick={() => onRemoveGeofence(zone.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remove Safe Zone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                  <p>Radius: {zone.radiusMeters} meters</p>
                  <p className="text-slate-400">
                    Alerts: {zone.alertOnEnter ? 'Entry' : ''}{' '}
                    {zone.alertOnEnter && zone.alertOnExit ? '&' : ''}{' '}
                    {zone.alertOnExit ? 'Exit' : ''}
                  </p>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-medium">Safe Boundary Active</span>
                <span className="text-[10px] text-slate-400">AirDroid Geofence v2</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Geofence Modal */}
      {showGeofenceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-base mb-1">Create Safe Geofence Zone</h3>
            <p className="text-xs text-slate-500 mb-4">
              Set a boundary around child&apos;s current coordinates to receive automatic arrival and departure notifications.
            </p>

            <form onSubmit={handleCreateGeofence} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  placeholder="e.g., Grandma's House, Soccer Club"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Zone Type</label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {(['home', 'school', 'park', 'custom'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewZoneType(t)}
                      className={`py-1.5 rounded-lg border capitalize font-medium ${
                        newZoneType === t
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Safe Radius Boundary</span>
                  <span className="text-blue-600 font-bold">{newZoneRadius} meters</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="600"
                  step="20"
                  value={newZoneRadius}
                  onChange={(e) => setNewZoneRadius(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>80m (Tight)</span>
                  <span>300m (Standard)</span>
                  <span>600m (Campus)</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 space-y-1">
                <p className="font-semibold">Center Coordinate:</p>
                <p className="text-[11px]">
                  {telemetry.currentLocation.lat.toFixed(5)}°, {telemetry.currentLocation.lng.toFixed(5)}°
                </p>
                <p className="text-[11px] text-blue-600">({telemetry.currentLocation.address})</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGeofenceModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  Save Safe Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
