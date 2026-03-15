import { useState } from 'react';
import type { Injury } from '../types';

interface BodyMapProps {
  injuries: Injury[];
  onZoneClick: (zoneId: string) => void;
  viewDate?: Date; // timeline slider date — recency is relative to this
}

/** Return RGB components as a string for use in rgba() */
function severityRGB(severity: number): string {
  if (severity <= 2) return '245,166,35';   // amber  #f5a623
  if (severity <= 3) return '255,107,53';   // orange #ff6b35
  return '220,38,38';                        // red    #dc2626
}

function severityStroke(severity: number): string {
  if (severity <= 2) return '#d48a10';
  if (severity <= 3) return '#e05010';
  return '#b01a1a';
}

function worstSeverity(zoneInjuries: Injury[]): number | null {
  if (zoneInjuries.length === 0) return null;
  return Math.max(...zoneInjuries.map(i => i.severity));
}

/** Calculate recency-based opacity relative to a reference date. Full intensity when recent, fades to 15% over 60 days */
function recencyOpacity(zoneInjuries: Injury[], referenceDate: Date): number {
  if (zoneInjuries.length === 0) return 1;
  const mostRecent = zoneInjuries.reduce((a, b) =>
    new Date(b.date) > new Date(a.date) ? b : a
  );
  const daysSince = Math.max(0, (referenceDate.getTime() - new Date(mostRecent.date).getTime()) / 86400000);
  return Math.max(0.15, 1.0 - (daysSince / 60));
}

/**
 * Professional body outline from open-source SVG anatomy project.
 * ViewBox: 0 0 420 780 — normal SVG coordinates, no transforms needed.
 * Source: SVG use selecting a region in human body (humanInner group, first path)
 */
const BODY_PATH =
  'M375.86,438.039c-4.383-1.051-14.305-5.084-17.721-7.705c-3.414-2.625-9.121-5.25-10.98-10.928' +
  'c-8.719-26.635-6.174-42.584-12.33-80.583c-3.279-20.259-10.594-38.978-12.291-49.546' +
  'c-5.002-31.152,0.314-68.261-9.955-100.304c-8.758-27.333-23.908-41.438-41.4-44.698' +
  'c-20.547-3.037-37.541-14.717-39.795-21.196c0.059-1.203,0.465-5.679,0.793-9.207' +
  'c4.123-3.525,6.537-7.708,7.357-11.811c1.736-8.662,4.16-12.907,4.16-12.907' +
  's3.189,1.093,4.959-1.936c0.781-1.342,0.545-4.525,1.527-9.028' +
  'c1.264-5.775,4.736-10.806-0.355-12.834c-2.934-1.165-4.52,0.494-4.52,0.494' +
  'c0.332-1.69,1.822-4.07,2.139-5.757c4.262-22.743-0.867-47.178-22.947-48.343' +
  'c-8.394-0.442-10.479-0.458-24.623,1.443c-23.828,3.204-25.584,26.232-23.307,40.744' +
  'c0.81,5.156,2.608,9.326,2.658,12.186c0.001,0.001,0.002,0.002,0.004,0.002' +
  'c-1.595-1.072-3.429-1.382-4.965-0.77c-5.09,2.029-1.616,7.059-0.354,12.834' +
  'c0.984,4.503,0.745,7.687,1.527,9.028c1.769,3.029,4.958,1.936,4.958,1.936' +
  's2.399,4.245,4.133,12.907c0.822,4.107,3.251,8.295,7.385,11.823' +
  'c0.337,3.668,0.754,8.354,0.795,9.194c-2.256,6.479-19.213,18.159-39.761,21.196' +
  'c-17.492,3.261-29.013,12.168-36.785,32.724c-12.462,32.957-8.649,82.364-14.569,112.278' +
  'c-2.078,10.5-9.012,29.288-12.291,49.546c-6.157,38-3.612,53.949-12.33,80.583' +
  'c-1.859,5.678-7.566,8.303-10.982,10.928c-3.414,2.617-13.337,6.654-17.719,7.705' +
  'c-4.387,1.053-12.249,2.311-10.652,5.324c1.592,3.008,10.973,3.93,15.565,3.357' +
  'c4.594-0.572,8.902-2.443,12.412-0.27c3.508,2.172,2.364,6.092,1.015,9.525' +
  'c-1.356,3.438-2.306,5.842-3.521,8.936c-1.221,3.094-4.678,10.863-6.029,14.295' +
  'c-1.354,3.439-6.797,11.219-1.717,12.424c5.086,1.211,7.301-7.443,9.34-10.611' +
  'c2.04-3.164,6.176-13.77,7.956-13.139c1.779,0.633-0.239,6.652-1.112,9.883' +
  'c-0.876,3.225-3.418,12.158-4.699,16.418c-1.282,4.262-3.459,7.77,0.665,9.393' +
  'c4.126,1.625,5.53-4.969,5.53-4.969s2.207-7.078,3.833-11.203' +
  'c1.955-4.959,3.715-17.967,5.722-17.484c1.845,0.445,1.681,6.135,1.803,9.328' +
  'c0.125,3.189-0.082,10.957-0.033,15.205c0.046,4.25-0.938,8.068,3.287,8.375' +
  'c4.221,0.301,3.621-6.111,3.621-6.111s0.428-5.977,0.736-10.201' +
  'c1.229-17.053,1.15-19.08,2.185-19.158c1.035-0.078,2.409,4.799,2.895,7.924' +
  'c0.472,3.031,1.129,10.461,1.644,14.508c0.512,4.051-0.004,7.803,4.057,7.629' +
  'c4.061-0.178,2.782-6.229,2.782-6.229s-0.248-5.75-0.419-9.816' +
  'c-0.161-3.729-1.881-10.793-2.289-14.807c-0.382-3.178,2.616-10.561,3.377-16.92' +
  'c0.903-10.361-3.785-20.211-3.23-26.406c1.803-20.283,6.973-28.092,14.745-49.844' +
  'c17.097-47.856,13.28-65.657,15.886-80.78c2.605-15.122,10.261-24.323,14.427-40.698' +
  'c5.112,20.145,7.377,54.859,6.403,76.693c-0.985,22.071-5.784,33.415-8.874,67.759' +
  'c-5.461,29.082,9.767,111.285,9.767,143.623c0,20.951-6.761,36.402-2.704,68.162' +
  'c12.218,95.697,12.934,104.977,4.644,121.693c-3.639,7.344-14.124,12.658-18.891,14.695' +
  's-11.323,6.408-17.261,8.039c-5.94,1.631-11.073,5.115-13.702,5.324' +
  'c-2.634,0.213-5.73,0.064-7.277,2.088c-1.55,2.027-1.46,4.814,1.659,7.197' +
  'c3.114,2.383,8.34,1.688,8.34,1.688c-1,0.877,6.705,4.803,11.274,2.691' +
  'c0,0,2.694,1.32,7.279,2.111c4.58,0.787,15.077-1.311,20.319-3.973' +
  'c5.242-2.654,15.64-6.559,21.285-6.191c5.647,0.365,14.962,3.043,20.338,2.461' +
  'c5.383-0.574,8.903-3.562,10.314-7.67c1.411-4.105-1.256-12.566-3.064-16.664' +
  'c-1.804-4.1-4.258-14.123-5.387-23.629c-1.456-12.289-2.07-54.711,2.704-72.016' +
  'c5.406-19.596,8.317-48.104,6.963-73.783c-1.35-25.682-1.963-22.494-1.227-34.037' +
  'c0.442-6.928,6.283-64.115,11.111-101.697c4.826,37.582,10.668,94.77,11.109,101.697' +
  'c0.736,11.543,0.123,8.355-1.227,34.037c-1.354,25.68,1.557,54.188,6.963,73.783' +
  'c4.775,17.305,4.16,59.727,2.705,72.016c-1.129,9.506-3.584,19.529-5.389,23.629' +
  'c-1.807,4.098-4.475,12.559-3.062,16.664c1.41,4.107,4.932,7.096,10.314,7.67' +
  'c5.375,0.582,14.691-2.096,20.338-2.461c5.646-0.367,16.043,3.537,21.285,6.191' +
  'c5.242,2.662,15.74,4.76,20.32,3.973c4.584-0.791,7.279-2.111,7.279-2.111' +
  'c4.57,2.111,12.273-1.814,11.273-2.691c0,0,5.227,0.695,8.34-1.688' +
  'c3.119-2.383,3.209-5.17,1.66-7.197c-1.547-2.023-4.645-1.875-7.277-2.088' +
  'c-2.629-0.209-7.762-3.693-13.703-5.324c-5.938-1.631-12.494-6.002-17.26-8.039' +
  'c-4.768-2.037-15.252-7.352-18.891-14.695c-8.291-16.717-7.574-25.996,4.643-121.693' +
  'c4.057-31.76-2.703-47.211-2.703-68.162c0-32.338,15.229-114.541,9.766-143.623' +
  'c-3.09-34.344-7.889-45.688-8.873-67.759c-0.975-21.834,1.291-56.548,6.402-76.693' +
  'c4.166,16.375,11.822,25.576,14.428,40.698c2.605,15.123-1.211,32.925,15.885,80.781' +
  'c7.773,21.75,12.943,29.559,14.746,49.842c0.555,6.195-4.135,16.045-3.23,26.406' +
  'c0.76,6.359,3.758,13.744,3.377,16.92c-0.408,4.014-2.129,11.078-2.291,14.809' +
  'c-0.17,4.064-0.418,9.814-0.418,9.814s-1.279,6.051,2.783,6.229' +
  'c4.059,0.174,3.543-3.578,4.057-7.629c0.514-4.047,1.172-11.477,1.643-14.508' +
  'c0.486-3.125,1.859-8.002,2.895-7.924s0.955,2.105,2.186,19.158' +
  'c0.309,4.225,0.734,10.201,0.734,10.201s-0.598,6.412,3.623,6.111' +
  'c4.223-0.305,3.24-4.125,3.287-8.375c0.049-4.248-0.158-12.016-0.035-15.205' +
  'c0.123-3.193-0.041-8.883,1.805-9.328c2.006-0.482,3.766,12.525,5.721,17.484' +
  'c1.627,4.125,3.834,11.203,3.834,11.203s1.402,6.594,5.529,4.969' +
  'c4.123-1.623,1.947-5.131,0.664-9.393c-1.279-4.26-3.822-13.193-4.697-16.418' +
  'c-0.873-3.23-2.893-9.25-1.113-9.883c1.781-0.631,5.916,9.975,7.957,13.139' +
  'c2.039,3.168,4.254,11.822,9.34,10.611c5.078-1.205-0.363-8.984-1.717-12.424' +
  'c-1.352-3.432-4.809-11.201-6.031-14.295c-1.215-3.094-2.164-5.498-3.52-8.936' +
  'c-1.35-3.434-2.494-7.354,1.014-9.525c3.51-2.174,7.818-0.303,12.412,0.27' +
  's10.975-0.35,12.566-3.357C385.108,440.35,380.246,439.092,375.86,438.039z';

export default function BodyMap({ injuries, onZoneClick, viewDate }: BodyMapProps) {
  const refDate = viewDate ?? new Date();
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const activeInjuries = injuries.filter(i => i.status !== 'healed');

  const injuryMap = new Map<string, Injury[]>();
  activeInjuries.forEach(injury => {
    const key = injury.bodyZoneId;
    if (!injuryMap.has(key)) injuryMap.set(key, []);
    injuryMap.get(key)!.push(injury);
  });

  const handleClick = (zoneId: string) => {
    setActiveZone(zoneId);
    onZoneClick(zoneId);
    setTimeout(() => setActiveZone(null), 300);
  };

  // Zone style helper — returns props for SVG elements
  const zs = (id: string) => {
    const zoneInjuries = injuryMap.get(id) ?? [];
    const sev = worstSeverity(zoneInjuries);
    const isActive = activeZone === id;

    let fill: string;
    let stroke: string;

    if (isActive) {
      fill = 'rgba(45,95,45,0.4)';
      stroke = '#2d5f2d';
    } else if (sev !== null) {
      // Calculate recency-based opacity
      const opacity = recencyOpacity(zoneInjuries, refDate);
      fill = `rgba(${severityRGB(sev)},${opacity.toFixed(2)})`;
      stroke = severityStroke(sev);
    } else {
      fill = 'rgba(100,130,110,0.12)';
      stroke = 'rgba(80,110,90,0.35)';
    }

    return {
      cursor: 'pointer' as const,
      style: {
        transition: 'all 0.2s ease',
        fill,
        stroke,
        strokeWidth: sev !== null ? 2 : 0.8,
        strokeDasharray: sev !== null ? undefined : '5 4',
        strokeLinejoin: 'round' as const,
      },
      onClick: () => handleClick(id),
    };
  };

  // Helper for the back pill fill (mirrors zs logic but returns plain fill string)
  const backFill = (): string => {
    const zoneInjuries = injuryMap.get('back') ?? [];
    const sev = worstSeverity(zoneInjuries);
    if (activeZone === 'back') return 'rgba(45,95,45,0.25)';
    if (sev !== null) {
      const opacity = recencyOpacity(zoneInjuries, refDate);
      return `rgba(${severityRGB(sev)},${opacity.toFixed(2)})`;
    }
    return 'white';
  };

  const backStroke = (): string => {
    const zoneInjuries = injuryMap.get('back') ?? [];
    const sev = worstSeverity(zoneInjuries);
    if (activeZone === 'back') return '#2d5f2d';
    if (sev !== null) return severityStroke(sev);
    return '#b8c0b8';
  };

  // Badge centers in 420×780 coordinate space
  const zoneCenters: Record<string, [number, number]> = {
    'head':             [210,  47],
    'neck':             [210,  97],
    'left-shoulder':    [105, 140],
    'right-shoulder':   [315, 140],
    'chest':            [210, 140],
    'left-arm':         [ 85, 280],
    'right-arm':        [335, 280],
    'left-hand':        [ 85, 440],
    'right-hand':       [335, 440],
    'core':             [210, 245],
    'back':             [ 35, 170],
    'left-upper-leg':   [170, 410],
    'right-upper-leg':  [250, 410],
    'left-knee':        [170, 530],
    'right-knee':       [250, 530],
    'left-lower-leg':   [170, 630],
    'right-lower-leg':  [250, 630],
    'left-ankle-foot':  [170, 740],
    'right-ankle-foot': [250, 740],
  };

  return (
    <div className="flex flex-col items-center h-full">

      {/* Body SVG — native 420×780 viewBox, scaled via CSS */}
      <div className="relative flex-1 w-full max-w-[260px]">
        <svg
          viewBox="0 0 420 780"
          className="w-full h-full"
          style={{ maxHeight: '65vh' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* clipPath uses the real body outline — no transforms needed */}
            <clipPath id="bodyClip">
              <path d={BODY_PATH} />
            </clipPath>
          </defs>

          {/* ── BACKGROUND SILHOUETTE — warm skin tone, non-interactive ── */}
          <path
            d={BODY_PATH}
            fill="#e8ddd4"
            stroke="#c0a898"
            strokeWidth="1"
            style={{ pointerEvents: 'none' }}
          />

          {/* ── CLICKABLE ZONES — rects clipped to body outline ── */}

          {/* HEAD (full width at top, clipped to head shape) */}
          <rect x={60}  y={10}  width={300} height={75}  clipPath="url(#bodyClip)" {...zs('head')} />

          {/* NECK */}
          <rect x={160} y={85}  width={100} height={25}  clipPath="url(#bodyClip)" {...zs('neck')} />

          {/* LEFT SHOULDER (viewer's left = patient's right) */}
          <rect x={40}  y={110} width={130} height={60}  clipPath="url(#bodyClip)" {...zs('left-shoulder')} />

          {/* CHEST (center band) */}
          <rect x={170} y={110} width={80}  height={60}  clipPath="url(#bodyClip)" {...zs('chest')} />

          {/* RIGHT SHOULDER */}
          <rect x={250} y={110} width={130} height={60}  clipPath="url(#bodyClip)" {...zs('right-shoulder')} />

          {/* LEFT ARM */}
          <rect x={40}  y={170} width={90}  height={220} clipPath="url(#bodyClip)" {...zs('left-arm')} />

          {/* CORE (belly/torso center) */}
          <rect x={130} y={170} width={160} height={150} clipPath="url(#bodyClip)" {...zs('core')} />

          {/* RIGHT ARM */}
          <rect x={290} y={170} width={90}  height={220} clipPath="url(#bodyClip)" {...zs('right-arm')} />

          {/* LEFT HAND */}
          <rect x={40}  y={390} width={90}  height={100} clipPath="url(#bodyClip)" {...zs('left-hand')} />

          {/* RIGHT HAND */}
          <rect x={290} y={390} width={90}  height={100} clipPath="url(#bodyClip)" {...zs('right-hand')} />

          {/* LEFT UPPER LEG */}
          <rect x={130} y={320} width={80}  height={180} clipPath="url(#bodyClip)" {...zs('left-upper-leg')} />

          {/* RIGHT UPPER LEG */}
          <rect x={210} y={320} width={80}  height={180} clipPath="url(#bodyClip)" {...zs('right-upper-leg')} />

          {/* LEFT KNEE */}
          <rect x={130} y={500} width={80}  height={60}  clipPath="url(#bodyClip)" {...zs('left-knee')} />

          {/* RIGHT KNEE */}
          <rect x={210} y={500} width={80}  height={60}  clipPath="url(#bodyClip)" {...zs('right-knee')} />

          {/* LEFT LOWER LEG */}
          <rect x={130} y={560} width={80}  height={140} clipPath="url(#bodyClip)" {...zs('left-lower-leg')} />

          {/* RIGHT LOWER LEG */}
          <rect x={210} y={560} width={80}  height={140} clipPath="url(#bodyClip)" {...zs('right-lower-leg')} />

          {/* LEFT ANKLE/FOOT */}
          <rect x={130} y={700} width={80}  height={78}  clipPath="url(#bodyClip)" {...zs('left-ankle-foot')} />

          {/* RIGHT ANKLE/FOOT */}
          <rect x={210} y={700} width={80}  height={78}  clipPath="url(#bodyClip)" {...zs('right-ankle-foot')} />

          {/* ── RUG (BACK) — pill button outside the silhouette ── */}
          <rect
            x={5} y={150} width={62} height={32} rx={10}
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fill: backFill(),
              stroke: backStroke(),
              strokeWidth: 1.2,
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))',
            }}
            onClick={() => handleClick('back')}
          />
          <text
            x={36} y={171}
            textAnchor="middle"
            fontSize="13"
            fill="#444"
            style={{ pointerEvents: 'none', fontFamily: 'system-ui, sans-serif', fontWeight: '500' }}
          >
            Rug
          </text>
          {/* Dashed connector line from pill to torso */}
          <line
            x1={67} y1={166}
            x2={130} y2={200}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            style={{ pointerEvents: 'none' }}
          />

          {/* ── INJURY COUNT BADGES ── */}
          {Array.from(injuryMap.entries()).map(([zoneId, zoneInjuries]) => {
            if (zoneInjuries.length <= 1) return null;
            const pos = zoneCenters[zoneId];
            if (!pos) return null;
            const [cx, cy] = pos;
            return (
              <g key={zoneId} style={{ pointerEvents: 'none' }}>
                <circle cx={cx} cy={cy} r="13" fill="white" stroke="#999" strokeWidth="1.5" />
                <text
                  x={cx} y={cy + 5}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="bold"
                  fill="#333"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {zoneInjuries.length}
                </text>
              </g>
            );
          })}

          {/* ── ADVICE BADGES — 💬 if any active/recovering injury has advice ── */}
          {Array.from(injuryMap.entries()).map(([zoneId, zoneInjuries]) => {
            const hasAdvice = zoneInjuries.some(i => i.advices && i.advices.length > 0 && (i.status === 'active' || i.status === 'recovering'));
            if (!hasAdvice) return null;
            const pos = zoneCenters[zoneId];
            if (!pos) return null;
            const [cx, cy] = pos;
            // Offset the badge so it doesn't overlap the count badge
            const bx = cx + 18;
            const by = cy - 14;
            return (
              <g key={`advice-${zoneId}`} style={{ pointerEvents: 'none' }}>
                <circle cx={bx} cy={by} r="11" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
                <text
                  x={bx} y={by + 5}
                  textAnchor="middle"
                  fontSize="12"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  💬
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Severity legend */}
      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-orange-300" style={{ background: '#f5a623' }} />
          Licht
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-orange-400" style={{ background: '#ff6b35' }} />
          Matig
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-red-400" style={{ background: '#dc2626' }} />
          Ernstig
        </span>
      </div>

      {/* Active/recovering counts */}
      {activeInjuries.length > 0 && (
        <div className="mt-1.5 text-sm text-gray-500">
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
