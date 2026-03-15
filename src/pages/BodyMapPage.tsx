import { useState, useMemo } from 'react';
import BodyMap from '../components/BodyMap';
import InjuryModal from '../components/InjuryModal';
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

export default function BodyMapPage({ injuries, onAddInjury }: BodyMapPageProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
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

      {selectedZone && (
        <InjuryModal
          zoneId={selectedZone}
          onSave={(data) => {
            onAddInjury(data);
            setSelectedZone(null);
          }}
          onClose={() => setSelectedZone(null)}
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
