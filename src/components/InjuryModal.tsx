import { useState, useEffect } from 'react';
import type { Injury, InjuryType, InjuryContext } from '../types';
import { INJURY_TYPES, INJURY_CONTEXTS, SEVERITY_COLORS, getBodyZone } from '../types';

interface InjuryModalProps {
  zoneId: string;
  injury?: Injury; // If editing
  onSave: (data: {
    bodyZoneId: string;
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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = () => {
    onSave({ bodyZoneId: zoneId, type, severity, context, date, notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-surface-800 rounded-t-2xl animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-surface-500 rounded-full" />
        </div>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {injury ? 'Blessure Bewerken' : 'Nieuwe Blessure'}
              </h2>
              <p className="text-rugby-400 text-sm mt-0.5">
                📍 {zone?.nameNl || zoneId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Type */}
          <label className="block mb-4">
            <span className="text-sm text-gray-400 mb-1.5 block">Type Blessure</span>
            <select
              value={type}
              onChange={e => setType(e.target.value as InjuryType)}
              className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rugby-600 transition-colors appearance-none"
            >
              {Object.entries(INJURY_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.nl} / {val.en}</option>
              ))}
            </select>
          </label>

          {/* Severity */}
          <div className="mb-4">
            <span className="text-sm text-gray-400 mb-2 block">Ernst (1-5)</span>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    severity === s
                      ? 'text-white shadow-lg scale-105'
                      : 'text-gray-500 bg-surface-700'
                  }`}
                  style={severity === s ? {
                    backgroundColor: SEVERITY_COLORS[s],
                    boxShadow: `0 4px 12px ${SEVERITY_COLORS[s]}40`,
                  } : undefined}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-1.5 px-1">
              <span className="text-[10px] text-gray-500">Mild</span>
              <span className="text-[10px] text-gray-500">Ernstig</span>
            </div>
          </div>

          {/* Context */}
          <div className="mb-4">
            <span className="text-sm text-gray-400 mb-2 block">Context</span>
            <div className="flex gap-2">
              {(Object.entries(INJURY_CONTEXTS) as [InjuryContext, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setContext(key)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    context === key
                      ? 'bg-rugby-700 text-white'
                      : 'bg-surface-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {key === 'training' ? '🏋️' : key === 'wedstrijd' ? '🏉' : '📋'} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <label className="block mb-4">
            <span className="text-sm text-gray-400 mb-1.5 block">Datum</span>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rugby-600 transition-colors"
            />
          </label>

          {/* Notes */}
          <label className="block mb-6">
            <span className="text-sm text-gray-400 mb-1.5 block">Notities</span>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Beschrijving van de blessure..."
              rows={3}
              className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rugby-600 transition-colors resize-none placeholder:text-gray-600"
            />
          </label>

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full bg-rugby-700 hover:bg-rugby-600 text-white py-3.5 rounded-xl font-semibold transition-colors active:scale-[0.98] shadow-lg"
          >
            {injury ? 'Opslaan' : 'Blessure Registreren'}
          </button>
        </div>
      </div>
    </div>
  );
}
