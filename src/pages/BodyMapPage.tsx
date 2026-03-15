import { useState, useMemo } from 'react';
import BodyMap from '../components/BodyMap';
import InjuryModal from '../components/InjuryModal';
import InjuryDetail from '../components/InjuryDetail';
import { INJURY_TYPES, SEVERITY_COLORS, STATUS_COLORS, STATUS_LABELS, getBodyZone } from '../types';
import type { Injury, InjuryType, InjuryContext } from '../types';

interface BodyMapPageProps {
  injuries: Injury[];
  onAddInjury: (data: {
    bodyZoneId: string;
    subLocation?: string;
    side?: 'links' | 'rechts' | 'midden';
    type: InjuryType;
    severity: 1 | 2 | 3 | 4 | 5;
    context: InjuryContext;
    date: string;
    notes: string;
  }) => void;
  onUpdateStatus: (id: string, status: import('../types').InjuryStatus) => void;
  onUpdate: (id: string, updates: Partial<Injury>) => void;
  onDelete: (id: string) => void;
}

/** Format a Date as Dutch locale short date, e.g. "15 mrt 2026" */
function formatDutchDate(date: Date): string {
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Check if two dates represent the same calendar day */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function BodyMapPage({ injuries, onAddInjury, onUpdateStatus, onUpdate, onDelete }: BodyMapPageProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showNewInjury, setShowNewInjury] = useState(false);
  const [selectedInjuryDetail, setSelectedInjuryDetail] = useState<Injury | null>(null);
  const [sliderValue, setSliderValue] = useState(100); // 0–100, default 100 = today

  // Determine the full time range from injuries
  const { minDate, maxDate, hasInjuries } = useMemo(() => {
    if (injuries.length === 0) {
      return { minDate: new Date(), maxDate: new Date(), hasInjuries: false };
    }
    const dates = injuries.map(i => new Date(i.date).getTime());
    return {
      minDate: new Date(Math.min(...dates)),
      maxDate: new Date(),
      hasInjuries: true,
    };
  }, [injuries]);

  // Convert slider value (0–100) to a date in the range [minDate, maxDate]
  const timelineDate = useMemo(() => {
    if (!hasInjuries) return new Date();
    const minTime = minDate.getTime();
    const maxTime = maxDate.getTime();
    const t = minTime + (sliderValue / 100) * (maxTime - minTime);
    const d = new Date(t);
    // Set to end of that day so injuries ON that date are included
    d.setHours(23, 59, 59, 999);
    return d;
  }, [sliderValue, minDate, maxDate, hasInjuries]);

  const isToday = isSameDay(timelineDate, new Date());

  // Filter injuries to those that "existed" at the selected date
  const filteredInjuries = useMemo(() => {
    return injuries.filter(i => {
      const injDate = new Date(i.date);
      if (injDate > timelineDate) return false;
      if (i.status === 'healed' && i.recoveryDate && new Date(i.recoveryDate) < timelineDate) return false;
      return true;
    });
  }, [injuries, timelineDate]);

  return (
    <div className="h-full flex flex-col px-4 pt-3 pb-2">
      <div className="text-center mb-2">
        <h1 className="text-lg font-bold text-gray-900">Blessure Logboek</h1>
        <p className="text-xs text-gray-400">Tik op een lichaamsdeel om een blessure te registreren</p>
      </div>

      {/* Tijdreis banner — shown when not at "today" */}
      {hasInjuries && !isToday && (
        <div
          className="mb-2 text-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg py-1.5 px-3"
          style={{ transition: 'opacity 0.3s ease' }}
        >
          🕐 Je bekijkt: {formatDutchDate(timelineDate)}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <BodyMap
          injuries={filteredInjuries}
          onZoneClick={setSelectedZone}
          viewDate={timelineDate}
        />
      </div>

      {/* Time slider — only when there are injuries */}
      {hasInjuries && (
        <div className="mt-3 mb-1 px-1">
          {/* Date label centered above thumb */}
          <div className="relative h-5 mb-1">
            <span
              className="absolute text-xs font-medium text-gray-600 whitespace-nowrap"
              style={{
                left: `${sliderValue}%`,
                transform: 'translateX(-50%)',
                transition: 'left 0.1s ease',
              }}
            >
              {formatDutchDate(timelineDate)}
            </span>
          </div>

          {/* Slider track + thumb */}
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={sliderValue}
            onChange={e => setSliderValue(Number(e.target.value))}
            className="w-full"
            style={{
              WebkitAppearance: 'none',
              appearance: 'none',
              height: '4px',
              borderRadius: '2px',
              background: `linear-gradient(to right, #2d5f2d ${sliderValue}%, #e5e7eb ${sliderValue}%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />

          {/* Labels below */}
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>Tijdreis</span>
            <span className={isToday ? 'text-green-700 font-medium' : ''}>Vandaag</span>
          </div>
        </div>
      )}

      {/* Zone tapped — show existing injuries or new injury modal */}
      {selectedZone && (() => {
        const zoneInjuries = injuries.filter(i => i.bodyZoneId === selectedZone && i.status !== 'healed');
        const zone = getBodyZone(selectedZone);
        const formatDate = (s: string) => new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(s));

        // No existing injuries — go straight to new injury modal
        if (zoneInjuries.length === 0 || showNewInjury) {
          return (
            <InjuryModal
              zoneId={selectedZone}
              onSave={(data) => {
                onAddInjury(data);
                setSelectedZone(null);
                setShowNewInjury(false);
              }}
              onClose={() => { setSelectedZone(null); setShowNewInjury(false); }}
            />
          );
        }

        // Has existing injuries — show overview
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectedZone(null)}>
            <div className="absolute inset-0 bg-black/40 animate-fade-in" />
            <div
              className="relative w-full max-w-lg bg-white rounded-t-2xl animate-slide-up max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>
              <div className="px-5 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{zone?.nameNl || selectedZone}</h2>
                  <button onClick={() => setSelectedZone(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
                </div>
                <div className="space-y-2 mb-4">
                  {zoneInjuries.map(inj => (
                    <button
                      key={inj.id}
                      onClick={() => { setSelectedZone(null); setSelectedInjuryDetail(inj); }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3 text-left hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ backgroundColor: `${SEVERITY_COLORS[inj.severity]}18`, color: SEVERITY_COLORS[inj.severity] }}
                      >
                        {inj.severity}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{INJURY_TYPES[inj.type].nl}</span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: `${STATUS_COLORS[inj.status]}18`, color: STATUS_COLORS[inj.status] }}
                          >
                            {STATUS_LABELS[inj.status]}
                          </span>
                          {inj.advices && inj.advices.length > 0 && <span className="text-xs">💬</span>}
                        </div>
                        <div className="text-xs text-gray-400">
                          {inj.subLocation && `${inj.subLocation} · `}{formatDate(inj.date)}
                        </div>
                      </div>
                      <div className="text-gray-300 flex-shrink-0">›</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowNewInjury(true)}
                  className="w-full py-3 bg-rugby-700 text-white font-semibold rounded-xl hover:bg-rugby-600 transition-colors text-sm"
                >
                  + Nieuwe blessure
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Injury detail modal */}
      {selectedInjuryDetail && (
        <InjuryDetail
          injury={selectedInjuryDetail}
          onUpdateStatus={(id, status) => {
            onUpdateStatus(id, status);
            setSelectedInjuryDetail({ ...selectedInjuryDetail, status });
          }}
          onUpdate={(id, updates) => {
            onUpdate(id, updates);
            setSelectedInjuryDetail({ ...selectedInjuryDetail, ...updates } as Injury);
          }}
          onDelete={(id) => { onDelete(id); setSelectedInjuryDetail(null); }}
          onClose={() => setSelectedInjuryDetail(null)}
        />
      )}

      {/* Slider thumb styling */}
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2d5f2d;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          transition: transform 0.1s ease;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type='range']::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2d5f2d;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
