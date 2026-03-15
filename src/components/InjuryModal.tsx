import { useState, useEffect } from 'react';
import type { Injury, InjuryType, InjuryContext } from '../types';
import { INJURY_TYPES, INJURY_CONTEXTS, SEVERITY_COLORS, getBodyZone } from '../types';

interface InjuryModalProps {
  zoneId: string;
  injury?: Injury; // If editing
  onSave: (data: {
    bodyZoneId: string;
    subLocation?: string;
    type: InjuryType;
    severity: 1 | 2 | 3 | 4 | 5;
    context: InjuryContext;
    date: string;
    notes: string;
  }) => void;
  onClose: () => void;
}

export default function InjuryModal({ zoneId, injury, onSave, onClose }: InjuryModalProps) {
  const zone = getBodyZone(zoneId);

  const [type, setType] = useState<InjuryType>(injury?.type || 'kneuzing');
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(injury?.severity || 1);
  const [context, setContext] = useState<InjuryContext>(injury?.context || 'training');
  const [date, setDate] = useState(injury?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(injury?.notes || '');
  const [subLocation, setSubLocation] = useState<string>(injury?.subLocation ?? '');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = () => {
    onSave({
      bodyZoneId: zoneId,
      subLocation: subLocation || undefined,
      type,
      severity,
      context,
      date,
      notes,
    });
  };

  const subLocations = zone?.subLocations ?? [];

  const inputStyle = {
    background: '#f2f2f7',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 16px',
    color: '#1c1c1e',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    appearance: 'none' as const,
  };

  const labelStyle = {
    fontSize: '13px',
    color: '#8e8e93',
    marginBottom: '6px',
    display: 'block',
    fontWeight: '500' as const,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-white animate-slide-up max-h-[90vh] overflow-y-auto"
        style={{ borderRadius: '24px 24px 0 0', boxShadow: '0 -4px 30px rgba(0,0,0,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full" style={{ background: '#d1d1d6' }} />
        </div>

        <div className="px-5 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#1c1c1e' }}>
                {injury ? 'Blessure Bewerken' : 'Nieuwe Blessure'}
              </h2>
              <p className="text-[13px] mt-0.5" style={{ color: '#30d158' }}>
                📍 {zone?.nameNl || zoneId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{ background: '#e5e5ea', color: '#8e8e93' }}
            >
              ✕
            </button>
          </div>

          {/* Sub-location */}
          {subLocations.length > 0 && (
            <div className="mb-5">
              <label style={labelStyle}>Locatie</label>
              <select
                value={subLocation}
                onChange={e => setSubLocation(e.target.value)}
                style={inputStyle}
              >
                <option value="">— Selecteer locatie —</option>
                {subLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          )}

          {/* Type */}
          <div className="mb-5">
            <label style={labelStyle}>Type Blessure</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as InjuryType)}
              style={inputStyle}
            >
              {Object.entries(INJURY_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.nl} / {val.en}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="mb-5">
            <span style={labelStyle}>Ernst (1-5)</span>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                  style={severity === s ? {
                    backgroundColor: SEVERITY_COLORS[s],
                    color: '#fff',
                    boxShadow: `0 4px 12px ${SEVERITY_COLORS[s]}40`,
                    transform: 'scale(1.05)',
                  } : {
                    backgroundColor: '#f2f2f7',
                    color: '#8e8e93',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[11px]" style={{ color: '#aeaeb2' }}>Mild</span>
              <span className="text-[11px]" style={{ color: '#aeaeb2' }}>Ernstig</span>
            </div>
          </div>

          {/* Context */}
          <div className="mb-5">
            <span style={labelStyle}>Context</span>
            <div className="flex gap-2">
              {(Object.entries(INJURY_CONTEXTS) as [InjuryContext, string][]).map(([key, ctxLabel]) => (
                <button
                  key={key}
                  onClick={() => setContext(key)}
                  className="flex-1 py-3 rounded-xl text-[13px] font-medium transition-all"
                  style={context === key
                    ? { background: '#30d158', color: '#fff' }
                    : { background: '#f2f2f7', color: '#8e8e93' }
                  }
                >
                  {key === 'training' ? '🏋️' : key === 'wedstrijd' ? '🏉' : '📋'} {ctxLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="mb-5">
            <label style={labelStyle}>Datum</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Notes */}
          <div className="mb-7">
            <label style={labelStyle}>Notities</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Beschrijving van de blessure..."
              rows={3}
              style={{
                ...inputStyle,
                resize: 'none',
              }}
              className="placeholder:text-[#aeaeb2]"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full text-white py-3.5 rounded-xl font-semibold text-[15px] transition-colors active:scale-[0.98]"
            style={{ background: '#30d158' }}
          >
            {injury ? 'Opslaan' : 'Blessure Registreren'}
          </button>
        </div>
      </div>
    </div>
  );
}
