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
    <div className="h-full flex flex-col px-4 pt-4 pb-2" style={{ background: '#f2f2f7' }}>
      {/* Apple Health-style large title — left aligned */}
      <div className="mb-3">
        <h1 className="text-2xl font-bold" style={{ color: '#1c1c1e' }}>Body Map</h1>
        <p className="text-[13px] mt-0.5" style={{ color: '#8e8e93' }}>Tik op een lichaamsdeel om een blessure te registreren</p>
      </div>

      {/* Tijdreis banner — shown when not at "today" */}
      {hasInjuries && !isToday && (
        <div
          className="mb-3 text-center text-xs rounded-2xl py-2 px-3"
          style={{
            background: 'rgba(255,159,10,0.12)',
            color: '#c97007',
            transition: 'opacity 0.3s ease',
          }}
        >
          🕐 Je bekijkt: {formatDutchDate(timelineDate)}
        </div>
      )}

      {/* Body map — subtle radial gradient background */}
      <div
        className="flex-1 min-h-0 rounded-2xl overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #e8f0ff 0%, #f2f2f7 70%)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
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
          <div className="relative h-5 mb-1.5">
            <span
              className="absolute text-xs font-medium whitespace-nowrap"
              style={{
                left: `${sliderValue}%`,
                transform: 'translateX(-50%)',
                transition: 'left 0.1s ease',
                color: '#1c1c1e',
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
              height: '3px',
              borderRadius: '2px',
              background: `linear-gradient(to right, #30d158 ${sliderValue}%, #d1d1d6 ${sliderValue}%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />

          {/* Labels below */}
          <div className="flex justify-between mt-1.5 text-[11px]" style={{ color: '#8e8e93' }}>
            <span>Tijdreis</span>
            <span style={{ color: isToday ? '#30d158' : '#8e8e93', fontWeight: isToday ? '600' : '400' }}>Vandaag</span>
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
              className="relative w-full max-w-lg bg-white animate-slide-up max-h-[80vh] overflow-y-auto"
              style={{ borderRadius: '24px 24px 0 0', boxShadow: '0 -4px 30px rgba(0,0,0,0.12)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full" style={{ background: '#d1d1d6' }} />
              </div>
              <div className="px-5 pb-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold" style={{ color: '#1c1c1e' }}>{zone?.nameNl || selectedZone}</h2>
                  <button
                    onClick={() => setSelectedZone(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ background: '#e5e5ea', color: '#8e8e93' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Grouped injury cards */}
                <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  {zoneInjuries.map((inj, idx) => (
                    <button
                      key={inj.id}
                      onClick={() => { setSelectedZone(null); setSelectedInjuryDetail(inj); }}
                      className="w-full bg-white flex items-center gap-3 text-left px-4 py-3.5 transition-colors active:bg-gray-50"
                      style={{
                        borderBottom: idx < zoneInjuries.length - 1 ? '0.5px solid #e5e5ea' : 'none',
                      }}
                    >
                      {/* Left accent bar for severity */}
                      <div
                        className="w-1 self-stretch rounded-full flex-shrink-0"
                        style={{ background: SEVERITY_COLORS[inj.severity], minHeight: 40 }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[15px] font-medium" style={{ color: '#1c1c1e' }}>{INJURY_TYPES[inj.type].nl}</span>
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: `${STATUS_COLORS[inj.status]}18`, color: STATUS_COLORS[inj.status] }}
                          >
                            {STATUS_LABELS[inj.status]}
                          </span>
                          {inj.advices && inj.advices.length > 0 && <span className="text-xs">💬</span>}
                        </div>
                        <div className="text-[13px]" style={{ color: '#8e8e93' }}>
                          Ernst {inj.severity}/5{inj.subLocation && ` · ${inj.subLocation}`} · {formatDate(inj.date)}
                        </div>
                      </div>
                      <div style={{ color: '#c7c7cc' }}>›</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowNewInjury(true)}
                  className="w-full py-3.5 font-semibold rounded-xl text-[15px] text-white transition-colors"
                  style={{ background: '#30d158' }}
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
    </div>
  );
}
