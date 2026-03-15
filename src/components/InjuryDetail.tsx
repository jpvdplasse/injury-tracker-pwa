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
  onAdvice?: () => void;
}

function getAdvices(injury: Injury): Array<{ text: string; date: string; by?: string }> {
  if (injury.advices && injury.advices.length > 0) return injury.advices;
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

  const inputStyle = {
    background: '#f2f2f7',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 16px',
    color: '#1c1c1e',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    resize: 'none' as const,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 animate-fade-in" />

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
          <div className="flex items-center justify-between mb-5">
            <div className="flex-1 min-w-0 pr-3">
              <h2 className="text-xl font-bold" style={{ color: '#1c1c1e' }}>
                {zone?.nameNl || injury.bodyZoneId}
              </h2>
              <p className="text-[13px] mt-0.5" style={{ color: '#8e8e93' }}>
                {INJURY_TYPES[injury.type].nl}
                {injury.subLocation && ` · ${injury.subLocation}`}
                {' · '}{formatDate(injury.date)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Severity pill */}
              <span
                className="px-2.5 py-1 rounded-full text-[12px] font-bold"
                style={{
                  backgroundColor: `${SEVERITY_COLORS[injury.severity]}20`,
                  color: SEVERITY_COLORS[injury.severity],
                }}
              >
                Ernst {injury.severity}/5
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                style={{ background: '#e5e5ea', color: '#8e8e93' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Status badge */}
          <div
            className="inline-flex items-center px-3 py-1.5 rounded-full text-[13px] font-medium mb-5"
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

          {/* Info rows — Apple grouped table style */}
          <div
            className="rounded-2xl overflow-hidden mb-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
          >
            {[
              { label: 'Type', value: INJURY_TYPES[injury.type].nl },
              { label: 'Context', value: `${injury.context === 'training' ? '🏋️' : injury.context === 'wedstrijd' ? '🏉' : '📋'} ${INJURY_CONTEXTS[injury.context]}` },
              { label: 'Datum blessure', value: formatDate(injury.date) },
              { label: 'Dagen geleden', value: `${Math.max(0, Math.ceil((Date.now() - new Date(injury.date).getTime()) / 86400000))} dagen` },
              ...(injury.subLocation ? [{ label: 'Locatie', value: injury.subLocation }] : []),
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className="flex items-center justify-between bg-white px-4 py-3.5"
                style={{ borderBottom: i < arr.length - 1 ? '0.5px solid #e5e5ea' : 'none' }}
              >
                <span className="text-[15px]" style={{ color: '#8e8e93' }}>{row.label}</span>
                <span className="text-[15px] font-medium" style={{ color: '#1c1c1e' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {injury.notes && (
            <div
              className="rounded-2xl p-4 mb-5"
              style={{ background: '#f2f2f7' }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#8e8e93' }}>Notities</div>
              <p className="text-[15px]" style={{ color: '#1c1c1e' }}>{injury.notes}</p>
            </div>
          )}

          {/* Advices timeline */}
          {advices.length > 0 && (
            <div className="mb-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#8e8e93' }}>
                Adviezen ({advices.length})
              </div>
              <div className="space-y-3">
                {[...advices]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((adv, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl p-4 pl-4"
                      style={{
                        background: 'rgba(48,209,88,0.08)',
                        borderLeft: '3px solid #30d158',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[13px] font-semibold" style={{ color: '#1c1c1e' }}>
                          {adv.by ? `Advies van ${adv.by}` : 'Advies van fysio'}
                        </span>
                        <span className="text-[11px] ml-auto" style={{ color: '#8e8e93' }}>{formatDate(adv.date)}</span>
                      </div>
                      <p className="text-[14px] leading-relaxed" style={{ color: '#3a3a3c' }}>{adv.text}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Advies geven button — readOnly mode */}
          {readOnly && onAdvice && (
            <button
              onClick={onAdvice}
              className="w-full mb-5 py-3.5 text-white font-semibold rounded-xl text-[15px]"
              style={{ background: '#30d158' }}
            >
              💬 Advies geven
            </button>
          )}

          {/* Status Progress */}
          <div className="mb-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#8e8e93' }}>
              Herstel Voortgang
            </div>
            <div className="flex items-center gap-1">
              {statusFlow.map((status, i) => (
                <div key={status} className="flex items-center flex-1">
                  <button
                    onClick={readOnly ? undefined : () => onUpdateStatus(injury.id, status)}
                    disabled={readOnly}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
                    style={i <= currentIndex ? {
                      backgroundColor: STATUS_COLORS[status],
                      color: '#fff',
                    } : {
                      backgroundColor: '#f2f2f7',
                      color: '#8e8e93',
                      cursor: readOnly ? 'default' : 'pointer',
                    }}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                  {i < statusFlow.length - 1 && (
                    <div className="w-2 h-0.5 mx-0.5" style={{ background: '#e5e5ea' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recovery Notes */}
          <div className="mb-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#8e8e93' }}>
              Herstel Notities
            </div>
            {readOnly ? (
              <p
                className="text-[15px] rounded-2xl px-4 py-3 min-h-[4rem]"
                style={{ background: '#f2f2f7', color: '#1c1c1e' }}
              >
                {injury.recoveryNotes || <span style={{ color: '#aeaeb2', fontStyle: 'italic' }}>Geen herstel notities</span>}
              </p>
            ) : (
              <>
                <textarea
                  value={recoveryNotes}
                  onChange={e => setRecoveryNotes(e.target.value)}
                  placeholder="Voeg herstel notities toe..."
                  rows={3}
                  style={inputStyle}
                  className="placeholder:text-[#aeaeb2]"
                />
                {recoveryNotes !== injury.recoveryNotes && (
                  <button
                    onClick={handleSaveNotes}
                    className="mt-2 px-4 py-2.5 text-white text-[13px] font-semibold rounded-xl"
                    style={{ background: '#30d158' }}
                  >
                    Notities Opslaan
                  </button>
                )}
              </>
            )}
          </div>

          {/* Recovery Date */}
          {injury.recoveryDate && (
            <div
              className="rounded-2xl p-4 mb-5"
              style={{ background: 'rgba(48,209,88,0.08)' }}
            >
              <div className="text-[15px] font-medium" style={{ color: '#30d158' }}>
                ✅ Hersteld op {formatDate(injury.recoveryDate)}
              </div>
            </div>
          )}

          {/* Delete — hidden in readOnly mode */}
          {!readOnly && (
            !showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 text-[15px] font-medium transition-colors"
                style={{ color: '#ff453a' }}
              >
                Blessure Verwijderen
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { onDelete(injury.id); onClose(); }}
                  className="flex-1 py-3 rounded-xl text-[14px] font-semibold"
                  style={{ background: 'rgba(255,69,58,0.1)', color: '#ff453a' }}
                >
                  Bevestig Verwijderen
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-[14px] font-medium"
                  style={{ background: '#f2f2f7', color: '#8e8e93' }}
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
