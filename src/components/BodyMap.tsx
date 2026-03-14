import { useState } from 'react';
import type { BodyView, Injury } from '../types';
import { STATUS_COLORS } from '../types';

interface BodyMapProps {
  injuries: Injury[];
  onZoneClick: (zoneId: string) => void;
}

// Maps zone IDs to approximate center positions (percentage-based) for injury dots
const ZONE_DOT_POSITIONS: Record<string, { x: number; y: number }> = {
  // Front
  'head': { x: 50, y: 7 },
  'neck': { x: 50, y: 14 },
  'left-shoulder': { x: 35, y: 19 },
  'right-shoulder': { x: 65, y: 19 },
  'chest': { x: 50, y: 25 },
  'left-upper-arm': { x: 28, y: 27 },
  'right-upper-arm': { x: 72, y: 27 },
  'left-elbow': { x: 25, y: 34 },
  'right-elbow': { x: 75, y: 34 },
  'abs': { x: 50, y: 35 },
  'left-forearm': { x: 22, y: 40 },
  'right-forearm': { x: 78, y: 40 },
  'left-hand': { x: 19, y: 48 },
  'right-hand': { x: 81, y: 48 },
  'left-hip': { x: 40, y: 43 },
  'right-hip': { x: 60, y: 43 },
  'left-thigh': { x: 40, y: 55 },
  'right-thigh': { x: 60, y: 55 },
  'left-knee': { x: 40, y: 65 },
  'right-knee': { x: 60, y: 65 },
  'left-shin': { x: 40, y: 75 },
  'right-shin': { x: 60, y: 75 },
  'left-ankle': { x: 40, y: 85 },
  'right-ankle': { x: 60, y: 85 },
  'left-foot': { x: 40, y: 92 },
  'right-foot': { x: 60, y: 92 },
  // Back
  'upper-back': { x: 50, y: 24 },
  'lower-back': { x: 50, y: 36 },
  'left-hamstring': { x: 40, y: 57 },
  'right-hamstring': { x: 60, y: 57 },
  'left-calf': { x: 40, y: 76 },
  'right-calf': { x: 60, y: 76 },
};

function FrontBody({ onZoneClick, activeZone }: { onZoneClick: (id: string) => void; activeZone: string | null }) {
  const zoneStyle = (id: string) => ({
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fill: activeZone === id ? 'rgba(45, 95, 45, 0.5)' : 'rgba(255,255,255,0.08)',
    stroke: activeZone === id ? '#4a9a4a' : 'rgba(255,255,255,0.2)',
    strokeWidth: 1.2,
  });

  return (
    <svg viewBox="0 0 200 400" className="w-full h-full" style={{ maxHeight: '65vh' }}>
      {/* Head */}
      <ellipse cx="100" cy="30" rx="22" ry="26" {...zoneStyle('head')} onClick={() => onZoneClick('head')} />
      {/* Neck */}
      <rect x="90" y="54" width="20" height="14" rx="4" {...zoneStyle('neck')} onClick={() => onZoneClick('neck')} />
      {/* Left Shoulder */}
      <path d="M70 68 Q58 68 52 78 L60 88 Q68 78 78 76 Z" {...zoneStyle('left-shoulder')} onClick={() => onZoneClick('left-shoulder')} />
      {/* Right Shoulder */}
      <path d="M130 68 Q142 68 148 78 L140 88 Q132 78 122 76 Z" {...zoneStyle('right-shoulder')} onClick={() => onZoneClick('right-shoulder')} />
      {/* Chest */}
      <path d="M78 76 L122 76 L126 110 L74 110 Z" {...zoneStyle('chest')} onClick={() => onZoneClick('chest')} />
      {/* Left Upper Arm */}
      <path d="M52 78 L60 88 L54 118 L44 110 Z" {...zoneStyle('left-upper-arm')} onClick={() => onZoneClick('left-upper-arm')} />
      {/* Right Upper Arm */}
      <path d="M148 78 L140 88 L146 118 L156 110 Z" {...zoneStyle('right-upper-arm')} onClick={() => onZoneClick('right-upper-arm')} />
      {/* Left Elbow */}
      <ellipse cx="50" cy="126" rx="8" ry="10" {...zoneStyle('left-elbow')} onClick={() => onZoneClick('left-elbow')} />
      {/* Right Elbow */}
      <ellipse cx="150" cy="126" rx="8" ry="10" {...zoneStyle('right-elbow')} onClick={() => onZoneClick('right-elbow')} />
      {/* Abs */}
      <path d="M74 110 L126 110 L124 160 L76 160 Z" {...zoneStyle('abs')} onClick={() => onZoneClick('abs')} />
      {/* Left Forearm */}
      <path d="M44 134 L54 134 L48 170 L38 166 Z" {...zoneStyle('left-forearm')} onClick={() => onZoneClick('left-forearm')} />
      {/* Right Forearm */}
      <path d="M156 134 L146 134 L152 170 L162 166 Z" {...zoneStyle('right-forearm')} onClick={() => onZoneClick('right-forearm')} />
      {/* Left Hand */}
      <ellipse cx="42" cy="184" rx="9" ry="14" {...zoneStyle('left-hand')} onClick={() => onZoneClick('left-hand')} />
      {/* Right Hand */}
      <ellipse cx="158" cy="184" rx="9" ry="14" {...zoneStyle('right-hand')} onClick={() => onZoneClick('right-hand')} />
      {/* Left Hip */}
      <path d="M76 160 L100 160 L96 180 L72 180 Z" {...zoneStyle('left-hip')} onClick={() => onZoneClick('left-hip')} />
      {/* Right Hip */}
      <path d="M100 160 L124 160 L128 180 L104 180 Z" {...zoneStyle('right-hip')} onClick={() => onZoneClick('right-hip')} />
      {/* Left Thigh */}
      <path d="M72 180 L96 180 L90 250 L74 250 Z" {...zoneStyle('left-thigh')} onClick={() => onZoneClick('left-thigh')} />
      {/* Right Thigh */}
      <path d="M104 180 L128 180 L126 250 L110 250 Z" {...zoneStyle('right-thigh')} onClick={() => onZoneClick('right-thigh')} />
      {/* Left Knee */}
      <ellipse cx="82" cy="260" rx="12" ry="14" {...zoneStyle('left-knee')} onClick={() => onZoneClick('left-knee')} />
      {/* Right Knee */}
      <ellipse cx="118" cy="260" rx="12" ry="14" {...zoneStyle('right-knee')} onClick={() => onZoneClick('right-knee')} />
      {/* Left Shin */}
      <path d="M74 274 L90 274 L86 330 L76 330 Z" {...zoneStyle('left-shin')} onClick={() => onZoneClick('left-shin')} />
      {/* Right Shin */}
      <path d="M110 274 L126 274 L124 330 L114 330 Z" {...zoneStyle('right-shin')} onClick={() => onZoneClick('right-shin')} />
      {/* Left Ankle */}
      <ellipse cx="81" cy="340" rx="10" ry="10" {...zoneStyle('left-ankle')} onClick={() => onZoneClick('left-ankle')} />
      {/* Right Ankle */}
      <ellipse cx="119" cy="340" rx="10" ry="10" {...zoneStyle('right-ankle')} onClick={() => onZoneClick('right-ankle')} />
      {/* Left Foot */}
      <path d="M71 350 L91 350 L88 375 Q80 380 72 375 Z" {...zoneStyle('left-foot')} onClick={() => onZoneClick('left-foot')} />
      {/* Right Foot */}
      <path d="M109 350 L129 350 L128 375 Q120 380 112 375 Z" {...zoneStyle('right-foot')} onClick={() => onZoneClick('right-foot')} />
    </svg>
  );
}

function BackBody({ onZoneClick, activeZone }: { onZoneClick: (id: string) => void; activeZone: string | null }) {
  const zoneStyle = (id: string) => ({
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fill: activeZone === id ? 'rgba(45, 95, 45, 0.5)' : 'rgba(255,255,255,0.08)',
    stroke: activeZone === id ? '#4a9a4a' : 'rgba(255,255,255,0.2)',
    strokeWidth: 1.2,
  });

  return (
    <svg viewBox="0 0 200 400" className="w-full h-full" style={{ maxHeight: '65vh' }}>
      {/* Head */}
      <ellipse cx="100" cy="30" rx="22" ry="26" {...zoneStyle('head')} onClick={() => onZoneClick('head')} />
      {/* Neck */}
      <rect x="90" y="54" width="20" height="14" rx="4" {...zoneStyle('neck')} onClick={() => onZoneClick('neck')} />
      {/* Left Shoulder */}
      <path d="M70 68 Q58 68 52 78 L60 88 Q68 78 78 76 Z" {...zoneStyle('left-shoulder')} onClick={() => onZoneClick('left-shoulder')} />
      {/* Right Shoulder */}
      <path d="M130 68 Q142 68 148 78 L140 88 Q132 78 122 76 Z" {...zoneStyle('right-shoulder')} onClick={() => onZoneClick('right-shoulder')} />
      {/* Upper Back */}
      <path d="M78 76 L122 76 L126 110 L74 110 Z" {...zoneStyle('upper-back')} onClick={() => onZoneClick('upper-back')} />
      {/* Left Upper Arm */}
      <path d="M52 78 L60 88 L54 118 L44 110 Z" {...zoneStyle('left-upper-arm')} onClick={() => onZoneClick('left-upper-arm')} />
      {/* Right Upper Arm */}
      <path d="M148 78 L140 88 L146 118 L156 110 Z" {...zoneStyle('right-upper-arm')} onClick={() => onZoneClick('right-upper-arm')} />
      {/* Left Elbow */}
      <ellipse cx="50" cy="126" rx="8" ry="10" {...zoneStyle('left-elbow')} onClick={() => onZoneClick('left-elbow')} />
      {/* Right Elbow */}
      <ellipse cx="150" cy="126" rx="8" ry="10" {...zoneStyle('right-elbow')} onClick={() => onZoneClick('right-elbow')} />
      {/* Lower Back */}
      <path d="M74 110 L126 110 L124 160 L76 160 Z" {...zoneStyle('lower-back')} onClick={() => onZoneClick('lower-back')} />
      {/* Left Forearm */}
      <path d="M44 134 L54 134 L48 170 L38 166 Z" {...zoneStyle('left-forearm')} onClick={() => onZoneClick('left-forearm')} />
      {/* Right Forearm */}
      <path d="M156 134 L146 134 L152 170 L162 166 Z" {...zoneStyle('right-forearm')} onClick={() => onZoneClick('right-forearm')} />
      {/* Left Hand */}
      <ellipse cx="42" cy="184" rx="9" ry="14" {...zoneStyle('left-hand')} onClick={() => onZoneClick('left-hand')} />
      {/* Right Hand */}
      <ellipse cx="158" cy="184" rx="9" ry="14" {...zoneStyle('right-hand')} onClick={() => onZoneClick('right-hand')} />
      {/* Left Hip */}
      <path d="M76 160 L100 160 L96 180 L72 180 Z" {...zoneStyle('left-hip')} onClick={() => onZoneClick('left-hip')} />
      {/* Right Hip */}
      <path d="M100 160 L124 160 L128 180 L104 180 Z" {...zoneStyle('right-hip')} onClick={() => onZoneClick('right-hip')} />
      {/* Left Hamstring */}
      <path d="M72 180 L96 180 L90 250 L74 250 Z" {...zoneStyle('left-hamstring')} onClick={() => onZoneClick('left-hamstring')} />
      {/* Right Hamstring */}
      <path d="M104 180 L128 180 L126 250 L110 250 Z" {...zoneStyle('right-hamstring')} onClick={() => onZoneClick('right-hamstring')} />
      {/* Left Knee */}
      <ellipse cx="82" cy="260" rx="12" ry="14" {...zoneStyle('left-knee')} onClick={() => onZoneClick('left-knee')} />
      {/* Right Knee */}
      <ellipse cx="118" cy="260" rx="12" ry="14" {...zoneStyle('right-knee')} onClick={() => onZoneClick('right-knee')} />
      {/* Left Calf */}
      <path d="M74 274 L90 274 L86 330 L76 330 Z" {...zoneStyle('left-calf')} onClick={() => onZoneClick('left-calf')} />
      {/* Right Calf */}
      <path d="M110 274 L126 274 L124 330 L114 330 Z" {...zoneStyle('right-calf')} onClick={() => onZoneClick('right-calf')} />
      {/* Left Ankle */}
      <ellipse cx="81" cy="340" rx="10" ry="10" {...zoneStyle('left-ankle')} onClick={() => onZoneClick('left-ankle')} />
      {/* Right Ankle */}
      <ellipse cx="119" cy="340" rx="10" ry="10" {...zoneStyle('right-ankle')} onClick={() => onZoneClick('right-ankle')} />
      {/* Left Foot */}
      <path d="M71 350 L91 350 L88 375 Q80 380 72 375 Z" {...zoneStyle('left-foot')} onClick={() => onZoneClick('left-foot')} />
      {/* Right Foot */}
      <path d="M109 350 L129 350 L128 375 Q120 380 112 375 Z" {...zoneStyle('right-foot')} onClick={() => onZoneClick('right-foot')} />
    </svg>
  );
}

interface InjuryDot {
  x: number;
  y: number;
  color: string;
  count: number;
  zoneId: string;
}

export default function BodyMap({ injuries, onZoneClick }: BodyMapProps) {
  const [view, setView] = useState<BodyView>('front');
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const handleZoneClick = (zoneId: string) => {
    setActiveZone(zoneId);
    onZoneClick(zoneId);
    setTimeout(() => setActiveZone(null), 300);
  };

  // Calculate injury dots for current view
  const frontZones = new Set([
    'head', 'neck', 'left-shoulder', 'right-shoulder', 'chest',
    'left-upper-arm', 'right-upper-arm', 'left-elbow', 'right-elbow',
    'abs', 'left-forearm', 'right-forearm', 'left-hand', 'right-hand',
    'left-hip', 'right-hip', 'left-thigh', 'right-thigh',
    'left-knee', 'right-knee', 'left-shin', 'right-shin',
    'left-ankle', 'right-ankle', 'left-foot', 'right-foot',
  ]);

  const backZones = new Set([
    'head', 'neck', 'left-shoulder', 'right-shoulder', 'upper-back',
    'left-upper-arm', 'right-upper-arm', 'left-elbow', 'right-elbow',
    'lower-back', 'left-forearm', 'right-forearm', 'left-hand', 'right-hand',
    'left-hip', 'right-hip', 'left-hamstring', 'right-hamstring',
    'left-knee', 'right-knee', 'left-calf', 'right-calf',
    'left-ankle', 'right-ankle', 'left-foot', 'right-foot',
  ]);

  const currentZones = view === 'front' ? frontZones : backZones;
  const activeInjuries = injuries.filter(i => i.status !== 'healed');

  // Group injuries by zone
  const injuryDots: InjuryDot[] = [];
  const zoneMap = new Map<string, Injury[]>();

  activeInjuries.forEach(injury => {
    if (currentZones.has(injury.bodyZoneId) && ZONE_DOT_POSITIONS[injury.bodyZoneId]) {
      if (!zoneMap.has(injury.bodyZoneId)) {
        zoneMap.set(injury.bodyZoneId, []);
      }
      zoneMap.get(injury.bodyZoneId)!.push(injury);
    }
  });

  zoneMap.forEach((zoneInjuries, zoneId) => {
    const pos = ZONE_DOT_POSITIONS[zoneId];
    // Use the most severe status color
    const worstInjury = zoneInjuries.sort((a, b) => {
      const statusOrder = { active: 0, recovering: 1, healed: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    })[0];

    injuryDots.push({
      x: pos.x,
      y: pos.y,
      color: STATUS_COLORS[worstInjury.status],
      count: zoneInjuries.length,
      zoneId,
    });
  });

  return (
    <div className="flex flex-col items-center h-full">
      {/* View Toggle */}
      <div className="flex bg-surface-800 rounded-xl p-1 mb-3 gap-1">
        <button
          onClick={() => setView('front')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'front'
              ? 'bg-rugby-700 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Voorkant
        </button>
        <button
          onClick={() => setView('back')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'back'
              ? 'bg-rugby-700 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Achterkant
        </button>
      </div>

      {/* Body + Dots */}
      <div className="relative flex-1 w-full max-w-[280px]">
        {view === 'front' ? (
          <FrontBody onZoneClick={handleZoneClick} activeZone={activeZone} />
        ) : (
          <BackBody onZoneClick={handleZoneClick} activeZone={activeZone} />
        )}

        {/* Injury dots overlay */}
        {injuryDots.map((dot) => (
          <div
            key={dot.zoneId}
            className="absolute animate-pulse-dot pointer-events-none"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="rounded-full flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: dot.color,
                width: dot.count > 1 ? 22 : 14,
                height: dot.count > 1 ? 22 : 14,
                boxShadow: `0 0 8px ${dot.color}80`,
              }}
            >
              {dot.count > 1 && (
                <span className="text-[10px] font-bold text-white">{dot.count}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Active injuries count */}
      {activeInjuries.length > 0 && (
        <div className="mt-2 text-sm text-gray-400">
          <span className="inline-block w-2 h-2 rounded-full bg-status-active mr-1.5" />
          {activeInjuries.filter(i => i.status === 'active').length} actief
          <span className="mx-2">·</span>
          <span className="inline-block w-2 h-2 rounded-full bg-status-recovering mr-1.5" />
          {activeInjuries.filter(i => i.status === 'recovering').length} herstellend
        </div>
      )}
    </div>
  );
}
