import { useState, useEffect, useCallback } from 'react';
import type { useSync, WatchEntry } from '../hooks/useSync';
import type { Injury } from '../types';
import { INJURY_TYPES, SEVERITY_COLORS, STATUS_LABELS, STATUS_COLORS, getBodyZone } from '../types';
import BodyMap from '../components/BodyMap';
import InjuryModal from '../components/InjuryModal';
import AdviceModal from '../components/AdviceModal';
import InjuryDetail from '../components/InjuryDetail';
import { encryptData } from '../utils/crypto';

type SyncHook = ReturnType<typeof useSync>;

interface FollowingPageProps {
  sync: SyncHook;
}

interface FollowedPersonData {
  injuries: Injury[];
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Nooit bijgewerkt';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Zojuist bijgewerkt';
  if (diff < 3600) return `${Math.floor(diff / 60)} min geleden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} uur geleden`;
  return `${Math.floor(diff / 86400)} dag(en) geleden`;
}

const POLL_INTERVAL = 30_000; // 30 seconds

export default function FollowingPage({ sync }: FollowingPageProps) {
  const { watching, pullData } = sync;
  const [selectedPerson, setSelectedPerson] = useState<WatchEntry | null>(null);
  const [personData, setPersonData] = useState<Record<string, FollowedPersonData>>({});
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [personView, setPersonView] = useState<'bodymap' | 'logboek'>('bodymap');
  const [selectedInjuryDetail, setSelectedInjuryDetail] = useState<Injury | null>(null);
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [adviceTarget, setAdviceTarget] = useState<Injury | null>(null);

  // Auto-open InjuryModal when write-user taps a zone with no active injuries
  useEffect(() => {
    if (!selectedZone || !selectedPerson || selectedPerson.permission !== 'write') return;
    const data = personData[selectedPerson.ownerId];
    const zoneInjuries = (data?.injuries ?? []).filter(i => i.bodyZoneId === selectedZone && i.status !== 'healed');
    if (zoneInjuries.length === 0) {
      setShowInjuryModal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone]);

  const fetchPerson = useCallback(async (entry: WatchEntry) => {
    setPersonData(prev => ({
      ...prev,
      [entry.ownerId]: {
        ...prev[entry.ownerId],
        injuries: prev[entry.ownerId]?.injuries ?? [],
        updatedAt: prev[entry.ownerId]?.updatedAt ?? null,
        loading: true,
        error: null,
        lastFetched: prev[entry.ownerId]?.lastFetched ?? null,
      },
    }));

    try {
      const result = await pullData(entry.ownerId, entry.encryptionKey);
      setPersonData(prev => ({
        ...prev,
        [entry.ownerId]: {
          injuries: result.injuries,
          updatedAt: result.updatedAt,
          loading: false,
          error: null,
          lastFetched: new Date(),
        },
      }));
    } catch (e: unknown) {
      setPersonData(prev => ({
        ...prev,
        [entry.ownerId]: {
          ...prev[entry.ownerId],
          loading: false,
          error: e instanceof Error ? e.message : 'Ophalen mislukt',
          lastFetched: null,
        },
      }));
    }
  }, [pullData]);

  // Initial fetch + polling for all watched people
  useEffect(() => {
    if (watching.length === 0) return;

    watching.forEach(entry => fetchPerson(entry));

    const interval = setInterval(() => {
      watching.forEach(entry => fetchPerson(entry));
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watching.map(w => w.ownerId).join(',')]);

  if (watching.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">👥</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Niemand gevolgd</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Vraag iemand om hun koppelcode te delen en voeg ze toe via het <strong>Delen</strong>-scherm (🔗).
        </p>
      </div>
    );
  }

  if (selectedPerson) {
    const data = personData[selectedPerson.ownerId];
    const label = selectedPerson.label ?? `Speler ${selectedPerson.ownerId.slice(0, 8)}`;

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100">
          <button
            onClick={() => setSelectedPerson(null)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600"
          >
            ←
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">{label}</h2>
            <p className="text-xs text-gray-400">
              {data?.loading ? (
                <span className="text-amber-600">Ophalen...</span>
              ) : (
                timeAgo(data?.updatedAt ?? null)
              )}
            </p>
          </div>
          <button
            onClick={() => fetchPerson(selectedPerson)}
            disabled={data?.loading}
            className="text-sm text-rugby-700 font-medium disabled:opacity-40"
          >
            ↻ Vernieuwen
          </button>
        </div>

        {/* View tabs */}
        <div className="flex gap-1 px-4 pb-2">
          {([['bodymap', '🏠 Body Map'], ['logboek', '📋 Logboek']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPersonView(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                personView === key
                  ? 'bg-rugby-700 text-white'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body map view */}
        {personView === 'bodymap' && (
        <>
        {/* Body map — editable if write permission */}
        <div className="flex-1 min-h-0 overflow-hidden px-4 py-2">
          {data?.error ? (
            <div className="text-center mt-10 text-sm text-red-600">{data.error}</div>
          ) : (
            <BodyMap
              injuries={data?.injuries ?? []}
              onZoneClick={selectedPerson.permission === 'write' ? (zoneId) => setSelectedZone(zoneId) : () => {}}
            />
          )}
        </div>

        {/* Zone injury list sheet — write access, zone has existing active/recovering injuries */}
        {selectedZone && selectedPerson.permission === 'write' && !showInjuryModal && (() => {
          const zoneInjuries = (data?.injuries ?? []).filter(i => i.bodyZoneId === selectedZone && i.status !== 'healed');
          if (zoneInjuries.length === 0) return null; // handled via useEffect
          const zone = getBodyZone(selectedZone);
          const formatDate = (s: string) => new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(s));
          return (
            <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectedZone(null)}>
              <div className="absolute inset-0 bg-black/40" />
              <div
                className="relative w-full max-w-lg bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>
                <div className="px-5 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-900">{zone?.nameNl || selectedZone}</h2>
                    <button onClick={() => setSelectedZone(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
                  </div>
                  <div className="space-y-2 mb-4">
                    {zoneInjuries.map(inj => (
                      <div key={inj.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
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
                            {inj.advice && <span className="text-xs">💬</span>}
                          </div>
                          <div className="text-xs text-gray-400">{formatDate(inj.date)}</div>
                        </div>
                        <button
                          onClick={() => setAdviceTarget(inj)}
                          className="flex-shrink-0 text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium hover:bg-green-100 transition-colors"
                        >
                          💬 Advies
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowInjuryModal(true)}
                    className="w-full py-3 bg-rugby-700 text-white font-semibold rounded-xl hover:bg-rugby-600 transition-colors text-sm"
                  >
                    + Nieuwe blessure
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* InjuryModal for new injury (write access) */}
        {selectedZone && selectedPerson.permission === 'write' && showInjuryModal && (
          <InjuryModal
            zoneId={selectedZone}
            onSave={async (injuryData) => {
              const currentInjuries = data?.injuries ?? [];
              const newInjury: Injury = {
                id: crypto.randomUUID(),
                ...injuryData,
                status: 'active',
                recoveryNotes: '',
                recoveryDate: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              const updatedInjuries = [...currentInjuries, newInjury];
              
              // Push to remote
              const API_BASE = 'https://injure-sync.jeanpaul.workers.dev';
              const encrypted = await encryptData(updatedInjuries, selectedPerson.encryptionKey);
              await fetch(`${API_BASE}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ownerId: selectedPerson.ownerId, encryptedData: encrypted }),
              });

              // Update local view
              setPersonData(prev => ({
                ...prev,
                [selectedPerson.ownerId]: {
                  ...prev[selectedPerson.ownerId],
                  injuries: updatedInjuries,
                  updatedAt: new Date().toISOString(),
                },
              }));
              setSelectedZone(null);
              setShowInjuryModal(false);
            }}
            onClose={() => { setShowInjuryModal(false); setSelectedZone(null); }}
          />
        )}

        {/* AdviceModal */}
        {adviceTarget && (
          <AdviceModal
            injury={adviceTarget}
            advisorName={selectedPerson.label ?? undefined}
            onSave={async (adviceText) => {
              const currentInjuries = data?.injuries ?? [];
              const updatedInjuries = currentInjuries.map(inj =>
                inj.id === adviceTarget.id
                  ? { ...inj, advice: adviceText, adviceDate: new Date().toISOString().slice(0, 10), adviceBy: selectedPerson.label ?? undefined, updatedAt: new Date().toISOString() }
                  : inj
              );

              const API_BASE = 'https://injure-sync.jeanpaul.workers.dev';
              const encrypted = await encryptData(updatedInjuries, selectedPerson.encryptionKey);
              await fetch(`${API_BASE}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ownerId: selectedPerson.ownerId, encryptedData: encrypted }),
              });

              setPersonData(prev => ({
                ...prev,
                [selectedPerson.ownerId]: {
                  ...prev[selectedPerson.ownerId],
                  injuries: updatedInjuries,
                  updatedAt: new Date().toISOString(),
                },
              }));
              setAdviceTarget(null);
              setSelectedZone(null);
            }}
            onClose={() => setAdviceTarget(null)}
          />
        )}

        {/* Stats bar */}
        {data && !data.error && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            <div className="flex justify-center gap-6 text-sm text-gray-500">
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />
                {data.injuries.filter(i => i.status === 'active').length} actief
              </span>
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
                {data.injuries.filter(i => i.status === 'recovering').length} herstellend
              </span>
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                {data.injuries.filter(i => i.status === 'healed').length} genezen
              </span>
            </div>
          </div>
        )}
        </>
        )}

        {/* Logboek view */}
        {personView === 'logboek' && (
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {!data || data.injuries.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">🏉</div>
                <p className="text-sm">Geen blessures gevonden</p>
              </div>
            ) : (
              [...data.injuries]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(injury => {
                  const zone = getBodyZone(injury.bodyZoneId);
                  const formatDate = (s: string) => new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(s));
                  return (
                    <button
                      key={injury.id}
                      onClick={() => setSelectedInjuryDetail(injury)}
                      className="w-full bg-white hover:bg-gray-50 rounded-xl p-4 flex items-center gap-3 transition-colors text-left shadow-sm border border-gray-200"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${SEVERITY_COLORS[injury.severity]}18` }}
                      >
                        <span className="text-lg font-bold" style={{ color: SEVERITY_COLORS[injury.severity] }}>
                          {injury.severity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {zone?.nameNl || injury.bodyZoneId}
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={{ backgroundColor: `${STATUS_COLORS[injury.status]}18`, color: STATUS_COLORS[injury.status] }}
                          >
                            {STATUS_LABELS[injury.status]}
                          </span>
                          {injury.advice && <span className="text-xs">💬</span>}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {INJURY_TYPES[injury.type].nl}
                          {injury.subLocation && ` · ${injury.subLocation}`}
                          {' · '}{formatDate(injury.date)}
                        </div>
                      </div>
                      <div className="text-gray-300 flex-shrink-0">›</div>
                    </button>
                  );
                })
            )}
          </div>
        )}

        {/* Injury detail modal (from logboek tap) */}
        {selectedInjuryDetail && (
          <InjuryDetail
            injury={selectedInjuryDetail}
            onUpdateStatus={() => {}}
            onUpdate={() => {}}
            onDelete={() => {}}
            onClose={() => setSelectedInjuryDetail(null)}
          />
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="h-full flex flex-col px-4 pt-4">
      <h1 className="text-lg font-bold text-gray-900 mb-1">Volgend</h1>
      <p className="text-xs text-gray-400 mb-4">Tik op een persoon om hun blessures te bekijken</p>

      <div className="space-y-3 overflow-y-auto flex-1">
        {watching.map(entry => {
          const data = personData[entry.ownerId];
          const label = entry.label ?? `Speler ${entry.ownerId.slice(0, 8)}`;
          const activeCount = data?.injuries.filter(i => i.status !== 'healed').length ?? 0;

          return (
            <button
              key={entry.ownerId}
              onClick={() => {
                setSelectedPerson(entry);
                if (!data) fetchPerson(entry);
              }}
              className="w-full text-left bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-center gap-4 active:bg-gray-50 transition-colors shadow-sm"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-rugby-700 bg-opacity-10 flex items-center justify-center text-xl flex-shrink-0">
                🧑‍🦽
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{label}</p>
                <p className="text-xs text-gray-400">
                  {entry.permission === 'read' ? '👀 Meekijken' : '✏️ Meewerken'}
                </p>
              </div>

              {/* Status */}
              <div className="text-right flex-shrink-0">
                {data?.loading ? (
                  <span className="text-xs text-amber-500">Ophalen...</span>
                ) : data?.error ? (
                  <span className="text-xs text-red-500">Fout</span>
                ) : data ? (
                  <>
                    {activeCount > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {activeCount} blessure{activeCount !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">✓ Geen actief</span>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(data.updatedAt)}</p>
                  </>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </div>

              <span className="text-gray-300 text-lg">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
