import { useState } from 'react';
import type { Injury, InjuryStatus } from '../types';
import { INJURY_TYPES, INJURY_CONTEXTS, SEVERITY_COLORS, STATUS_COLORS, STATUS_LABELS, getBodyZone } from '../types';

interface InjuryDetailProps {
  injury: Injury;
  onUpdateStatus: (id: string, status: InjuryStatus) => void;
  onUpdate: (id: string, updates: Partial<Injury>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  readOnly?: boolean;
  /** Show "Advies geven" button — caller handles the click */
  onAdvice?: () => void;
}

/** Backward-compat: get advices array even if injury has old single-advice fields */
function getAdvices(injury: Injury): Array<{ text: string; date: string; by?: string }> {
  if (injury.advices && injury.advices.length > 0) return injury.advices;
  // Legacy fallback
  const legacyAny = injury as unknown as Record<string, string | undefined>;
  if (legacyAny['advice']) {
    return [{
      text: legacyAny['advice']!,
      date: legacyAny['adviceDate'] ?? new Date().toISOString().slice(0, 10),
      by: legacyAny['adviceBy'],
    }];
  }
  return [];
}

export default function InjuryDetail({ injury, onUpdateStatus, onUpdate, onDelete, onClose, readOnly = false, onAdvice }: InjuryDetailProps) {
  const zone = getBodyZone(injury.bodyZoneId);
  const [recoveryNotes, setRecoveryNotes] = useState(injury.recoveryNotes);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const advices = getAdvices(injury);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const statusFlow: InjuryStatus[] = ['active', 'recovering', 'healed'];
  const currentIndex = statusFlow.indexOf(injury.status);

  const handleSaveNotes = () => {
    onUpdate(injury.id, { recoveryNotes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 animate-fade-in" />

      <div
        className="relative w-full max-w-lg bg-white rounded-t-2xl animate-slide-up max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-surface-600 rounded-full" />
        </div>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {zone?.nameNl || injury.bodyZoneId}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {INJURY_TYPES[injury.type].nl}
                {injury.subLocation && ` · ${injury.subLocation}`}
                {' · '}{formatDate(injury.date)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          {/* Status Badge */}
          <div
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mb-5"
            style={{
              backgroundColor: `${STATUS_COLORS[injury.status]}18`,
              color: STATUS_COLORS[injury.status],
            }}
          >
            <span
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: STATUS_COLORS[injury.status] }}
            />
            {STATUS_LABELS[injury.status]}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-surface-700 rounded-xl p-3 text-center border border-surface-600">
              <div className="text-xs text-gray-400 mb-1">Ernst</div>
              <div
                className="text-xl font-bold"
                style={{ color: SEVERITY_COLORS[injury.severity] }}
              >
                {injury.severity}/5
              </div>
            </div>
            <div className="bg-surface-700 rounded-xl p-3 text-center border border-surface-600">
              <div className="text-xs text-gray-400 mb-1">Context</div>
              <div className="text-sm font-medium text-gray-700">
                {injury.context === 'training' ? '🏋️' : injury.context === 'wedstrijd' ? '🏉' : '📋'}
                <br />{INJURY_CONTEXTS[injury.context]}
              </div>
            </div>
            <div className="bg-surface-700 rounded-xl p-3 text-center border border-surface-600">
              <div className="text-xs text-gray-400 mb-1">Dagen</div>
              <div className="text-xl font-bold text-gray-900">
                {Math.max(0, Math.ceil((Date.now() - new Date(injury.date).getTime()) / 86400000))}
              </div>
            </div>
          </div>

          {/* Notes */}
          {injury.notes && (
            <div className="bg-surface-700 rounded-xl p-4 mb-5 border border-surface-600">
              <div className="text-xs text-gray-400 mb-1">Notities</div>
              <p className="text-sm text-gray-700">{injury.notes}</p>
            </div>
          )}

          {/* Advices timeline (newest first) */}
          {advices.length > 0 && (
            <div className="mb-5 space-y-3">
              {[...advices]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((adv, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-4 border border-green-200"
                    style={{ borderLeftWidth: '4px', borderLeftColor: '#22c55e', background: '#f0fdf4' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">💬</span>
                      <span className="text-sm font-semibold text-green-800">
                        {adv.by ? `Advies van ${adv.by}` : 'Advies van fysio'}
                      </span>
                      <span className="text-xs text-green-500 ml-auto">{formatDate(adv.date)}</span>
                    </div>
                    <p className="text-sm text-green-900 leading-relaxed">{adv.text}</p>
                  </div>
                ))}
            </div>
          )}

          {/* "Advies geven" button — only shown in readOnly mode if caller provides handler */}
          {readOnly && onAdvice && (
            <button
              onClick={onAdvice}
              className="w-full mb-5 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-500 transition-colors text-sm"
            >
              💬 Advies geven
            </button>
          )}

          {/* Status Progress */}
          <div className="mb-5">
            <div className="text-sm text-gray-500 mb-3">Herstel Voortgang</div>
            <div className="flex items-center gap-1">
              {statusFlow.map((status, i) => (
                <div key={status} className="flex items-center flex-1">
                  <button
                    onClick={readOnly ? undefined : () => onUpdateStatus(injury.id, status)}
                    disabled={readOnly}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      i <= currentIndex
                        ? 'text-white'
                        : 'bg-surface-700 text-gray-400 border border-surface-600' +
                          (readOnly ? '' : ' hover:text-gray-700')
                    } ${readOnly ? 'cursor-default' : ''}`}
                    style={i <= currentIndex ? {
                      backgroundColor: STATUS_COLORS[status],
                    } : undefined}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                  {i < statusFlow.length - 1 && (
                    <div className="w-3 h-0.5 bg-surface-600 mx-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recovery Notes */}
          <div className="mb-5">
            <div className="text-sm text-gray-500 mb-2">Herstel Notities</div>
            {readOnly ? (
              <p className="text-sm text-gray-700 bg-surface-700 border border-surface-600 rounded-xl px-4 py-3 min-h-[4rem]">
                {injury.recoveryNotes || <span className="text-gray-400 italic">Geen herstel notities</span>}
              </p>
            ) : (
              <>
                <textarea
                  value={recoveryNotes}
                  onChange={e => setRecoveryNotes(e.target.value)}
                  placeholder="Voeg herstel notities toe..."
                  rows={3}
                  className="w-full bg-surface-700 border border-surface-600 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-rugby-600 transition-colors resize-none placeholder:text-gray-400"
                />
                {recoveryNotes !== injury.recoveryNotes && (
                  <button
                    onClick={handleSaveNotes}
                    className="mt-2 px-4 py-2 bg-rugby-700 text-white text-sm rounded-lg hover:bg-rugby-600 transition-colors"
                  >
                    Notities Opslaan
                  </button>
                )}
              </>
            )}
          </div>

          {/* Recovery Date */}
          {injury.recoveryDate && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
              <div className="text-sm text-green-700 font-medium">
                ✅ Hersteld op {formatDate(injury.recoveryDate)}
              </div>
            </div>
          )}

          {/* Delete — hidden in readOnly mode */}
          {!readOnly && (
            !showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
              >
                Blessure Verwijderen
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { onDelete(injury.id); onClose(); }}
                  className="flex-1 py-3 bg-red-50 text-red-500 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  Bevestig Verwijderen
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-surface-700 text-gray-500 border border-surface-600 rounded-xl text-sm font-medium hover:text-gray-800 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
