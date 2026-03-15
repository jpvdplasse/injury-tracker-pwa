import { useState } from 'react';
import type { Injury } from '../types';
import { INJURY_TYPES, getBodyZone } from '../types';

interface AdviceModalProps {
  injury: Injury;
  advisorName?: string;
  onSave: (advice: string) => Promise<void>;
  onClose: () => void;
}

export default function AdviceModal({ injury, advisorName, onSave, onClose }: AdviceModalProps) {
  const [advice, setAdvice] = useState('');
  const [saving, setSaving] = useState(false);
  const zone = getBodyZone(injury.bodyZoneId);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const handleSave = async () => {
    if (!advice.trim()) return;
    setSaving(true);
    try {
      await onSave(advice.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 animate-fade-in" />
      <div
        className="relative w-full max-w-lg bg-white animate-slide-up"
        style={{ borderRadius: '24px 24px 0 0', boxShadow: '0 -4px 30px rgba(0,0,0,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full" style={{ background: '#d1d1d6' }} />
        </div>

        <div className="px-5 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold" style={{ color: '#1c1c1e' }}>💬 Advies geven</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{ background: '#e5e5ea', color: '#8e8e93' }}
            >
              ✕
            </button>
          </div>

          {/* Injury summary — grouped table style */}
          <div
            className="rounded-2xl overflow-hidden mb-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
          >
            <div className="bg-white px-4 py-3.5" style={{ borderBottom: '0.5px solid #e5e5ea' }}>
              <div className="text-[15px] font-medium" style={{ color: '#1c1c1e' }}>
                {zone?.nameNl || injury.bodyZoneId}
                {injury.subLocation && ` · ${injury.subLocation}`}
              </div>
            </div>
            <div className="bg-white px-4 py-3.5" style={{ borderBottom: '0.5px solid #e5e5ea' }}>
              <div className="text-[14px]" style={{ color: '#8e8e93' }}>
                {INJURY_TYPES[injury.type].nl} · {formatDate(injury.date)} · Ernst {injury.severity}/5
              </div>
            </div>
            {injury.notes && (
              <div className="bg-white px-4 py-3.5">
                <div className="text-[13px] italic" style={{ color: '#8e8e93' }}>"{injury.notes}"</div>
              </div>
            )}
          </div>

          {/* Advice textarea */}
          <div className="mb-6">
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: '#8e8e93' }}
            >
              Jouw advies
            </label>
            <textarea
              value={advice}
              onChange={e => setAdvice(e.target.value)}
              placeholder="Bijv. rust 3 dagen, ijs 3× per dag, geen contact training..."
              rows={4}
              autoFocus
              style={{
                background: '#f2f2f7',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#1c1c1e',
                fontSize: '15px',
                outline: 'none',
                width: '100%',
                resize: 'none',
              }}
              className="placeholder:text-[#aeaeb2]"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!advice.trim() || saving}
            className="w-full py-3.5 text-white font-semibold rounded-xl text-[15px] disabled:opacity-40"
            style={{ background: '#30d158' }}
          >
            {saving ? 'Opslaan...' : advisorName ? `Advies opslaan als ${advisorName}` : 'Advies Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}
