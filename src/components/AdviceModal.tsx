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
  // Always start with empty text — we're adding a new advice, not editing the old one
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
        className="relative w-full max-w-lg bg-white rounded-t-2xl animate-slide-up shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">💬 Advies geven</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          {/* Injury summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
            <div className="text-sm font-medium text-gray-800">
              {zone?.nameNl || injury.bodyZoneId}
              {injury.subLocation && ` · ${injury.subLocation}`}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {INJURY_TYPES[injury.type].nl} · {formatDate(injury.date)} · Ernst {injury.severity}/5
            </div>
            {injury.notes && (
              <div className="text-xs text-gray-500 mt-1 italic">"{injury.notes}"</div>
            )}
          </div>

          {/* Advice textarea */}
          <div className="mb-4">
            <label className="block text-sm text-gray-500 mb-2">Jouw advies</label>
            <textarea
              value={advice}
              onChange={e => setAdvice(e.target.value)}
              placeholder="Bijv. rust 3 dagen, ijs 3× per dag, geen contact training..."
              rows={4}
              autoFocus
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-green-400 transition-colors resize-none placeholder:text-gray-400"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!advice.trim() || saving}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Opslaan...' : advisorName ? `Advies opslaan als ${advisorName}` : 'Advies Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}
