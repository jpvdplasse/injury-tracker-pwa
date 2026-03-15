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

/** Get initials from a label string */
function getInitials(label: string): string {
  const words = label.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const POLL_INTERVAL = 30_000;

export default function FollowingPage({ sync }: FollowingPageProps) {
  const { watching, pullData } = sync;
  const [selectedPerson, setSelectedPerson] = useState<WatchEntry | null>(null);
  const [personData, setPersonData] = useState<Record<string, FollowedPersonData>>({});
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [personView, setPersonView] = useState<'bodymap' | 'logboek'>('bodymap');
  const [selectedInjuryDetail, setSelectedInjuryDetail] = useState<Injury | null>(null);
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [adviceTarget, setAdviceTarget] = useState<Injury | null>(null);

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
      <div className="h-full flex flex-col items-center justify-center px-6 text-center" style={{ background: '#f2f2f7' }}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
          style={{ background: '#e5e5ea' }}
        >
          👥
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#1c1c1e' }}>Niemand gevolgd</h2>
        <p className="text-[15px] leading-relaxed" style={{ color: '#8e8e93' }}>
          Vraag iemand om hun koppelcode te delen en voeg ze toe via het <strong style={{ color: '#1c1c1e' }}>Delen</strong>-scherm.
        </p>
      </div>
    );
  }

  if (selectedPerson) {
    const data = personData[selectedPerson.ownerId];
    const label = selectedPerson.label ?? `Speler ${selectedPerson.ownerId.slice(0, 8)}`;

    return (
      <div className="h-full flex flex-col" style={{ background: '#f2f2f7' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 bg-white" style={{ borderBottom: '0.5px solid #e5e5ea' }}>
          <button
            onClick={() => setSelectedPerson(null)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold"
            style={{ background: '#e5e5ea', color: '#1c1c1e' }}
          >
            ←
          </button>
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: '#30d158' }}
          >
            {getInitials(label)}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-[16px]" style={{ color: '#1c1c1e' }}>{label}</h2>
            <p className="text-[12px]" style={{ color: '#8e8e93' }}>
              {data?.loading ? (
                <span style={{ color: '#ff9f0a' }}>Ophalen...</span>
              ) : (
                timeAgo(data?.updatedAt ?? null)
              )}
            </p>
          </div>
          <button
            onClick={() => fetchPerson(selectedPerson)}
            disabled={data?.loading}
            className="text-sm font-semibold disabled:opacity-40"
            style={{ color: '#30d158' }}
          >
            ↻
          </button>
        </div>

        {/* View tabs — pill style */}
        <div className="flex gap-2 px-4 pt-3 pb-2">
          {([['bodymap', '🗺️ Body Map'], ['logboek', '📋 Logboek']] as const).map(([key, tabLabel]) => (
            <button
              key={key}
              onClick={() => setPersonView(key)}
              className="flex-1 py-2 rounded-full text-[13px] font-medium transition-all"
              style={
                personView === key
                  ? { background: '#30d158', color: '#fff' }
                  : { background: '#e5e5ea', color: '#8e8e93' }
              }
            >
              {tabLabel}
            </button>
          ))}
        </div>

        {/* Body map view */}
        {personView === 'bodymap' && (
        <>
        <div
          className="flex-1 min-h-0 overflow-hidden mx-4 mb-3 rounded-2xl"
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, #e8f0ff 0%, #f2f2f7 70%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          {data?.error ? (
            <div className="text-center mt-10 text-sm" style={{ color: '#ff453a' }}>{data.error}</div>
          ) : (
            <BodyMap
              injuries={data?.injuries ?? []}
              onZoneClick={selectedPerson.permission === 'write' ? (zoneId) => setSelectedZone(zoneId) : () => {}}
            />
          )}
        </div>

        {/* Zone injury list sheet */}
        {selectedZone && selectedPerson.permission === 'write' && !showInjuryModal && (() => {
          const zoneInjuries = (data?.injuries ?? []).filter(i => i.bodyZoneId === selectedZone && i.status !== 'healed');
          if (zoneInjuries.length === 0) return null;
          const zone = getBodyZone(selectedZone);
          const formatDate = (s: string) => new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(s));
          return (
            <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectedZone(null)}>
              <div className="absolute inset-0 bg-black/40 animate-fade-in" />
              <div
                className="relative w-full max-w-lg bg-white animate-slide-up max-h-[80vh] overflow-y-auto"
                style={{ borderRadius: '24px 24px 0 0', boxShadow: '0 -4px 30px rgba(0,0,0,0.12)' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-9 h-1 rounded-full" style={{ background: '#d1d1d6' }} />
                </div>
                <div className="px-5 pb-8">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold" style={{ color: '#1c1c1e' }}>{zone?.nameNl || selectedZone}</h2>
                    <button
                      onClick={() => setSelectedZone(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ background: '#e5e5ea', color: '#8e8e93' }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="rounded-2xl overflow-hidden mb-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    {zoneInjuries.map((inj, idx) => (
                      <div
                        key={inj.id}
                        className="bg-white flex items-center gap-0"
                        style={{ borderBottom: idx < zoneInjuries.length - 1 ? '0.5px solid #e5e5ea' : 'none' }}
                      >
                        <div
                          className="w-1 self-stretch flex-shrink-0"
                          style={{ background: SEVERITY_COLORS[inj.severity], minHeight: 60 }}
                        />
                        <button
                          onClick={() => { setSelectedZone(null); setSelectedInjuryDetail(inj); }}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left px-4 py-3.5"
                        >
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
                            <div className="text-[13px]" style={{ color: '#8e8e93' }}>{formatDate(inj.date)}</div>
                          </div>
                        </button>
                        <button
                          onClick={() => setAdviceTarget(inj)}
                          className="flex-shrink-0 text-[13px] px-3 py-1.5 rounded-xl font-medium mr-3"
                          style={{ background: 'rgba(48,209,88,0.12)', color: '#30d158' }}
                        >
                          💬 Advies
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowInjuryModal(true)}
                    className="w-full py-3.5 font-semibold rounded-xl text-[15px] text-white"
                    style={{ background: '#30d158' }}
                  >
                    + Nieuwe blessure
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* InjuryModal for new injury */}
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
              const newAdvice = {
                text: adviceText,
                date: new Date().toISOString().slice(0, 10),
                by: selectedPerson.label ?? undefined,
              };
              const updatedInjuries = currentInjuries.map(inj =>
                inj.id === adviceTarget.id
                  ? { ...inj, advices: [...(inj.advices ?? []), newAdvice], updatedAt: new Date().toISOString() }
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
          <div
            className="px-4 pb-3 pt-2 mx-0"
            style={{ borderTop: '0.5px solid #e5e5ea', background: '#fff' }}
          >
            <div className="flex justify-center gap-5 text-[13px]" style={{ color: '#8e8e93' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: '#ff453a' }} />
                {data.injuries.filter(i => i.status === 'active').length} actief
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: '#ff9f0a' }} />
                {data.injuries.filter(i => i.status === 'recovering').length} herstellend
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: '#30d158' }} />
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
              <div className="text-center py-16" style={{ color: '#8e8e93' }}>
                <div className="text-4xl mb-3">📋</div>
                <p className="text-[15px]">Geen blessures gevonden</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                {[...data.injuries]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((injury, idx, arr) => {
                    const zone = getBodyZone(injury.bodyZoneId);
                    const formatDate = (s: string) => new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(s));
                    return (
                      <button
                        key={injury.id}
                        onClick={() => setSelectedInjuryDetail(injury)}
                        className="w-full bg-white flex items-center gap-0 text-left transition-colors active:bg-gray-50"
                        style={{ borderBottom: idx < arr.length - 1 ? '0.5px solid #e5e5ea' : 'none' }}
                      >
                        <div
                          className="w-1 self-stretch flex-shrink-0"
                          style={{ background: SEVERITY_COLORS[injury.severity], minHeight: 60 }}
                        />
                        <div className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                            style={{
                              backgroundColor: `${SEVERITY_COLORS[injury.severity]}18`,
                              color: SEVERITY_COLORS[injury.severity],
                            }}
                          >
                            {injury.severity}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[15px] font-medium truncate" style={{ color: '#1c1c1e' }}>
                                {zone?.nameNl || injury.bodyZoneId}
                              </span>
                              <span
                                className="text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                                style={{ backgroundColor: `${STATUS_COLORS[injury.status]}18`, color: STATUS_COLORS[injury.status] }}
                              >
                                {STATUS_LABELS[injury.status]}
                              </span>
                              {injury.advices && injury.advices.length > 0 && <span className="text-xs">💬</span>}
                            </div>
                            <div className="text-[13px]" style={{ color: '#8e8e93' }}>
                              {INJURY_TYPES[injury.type].nl}
                              {injury.subLocation && ` · ${injury.subLocation}`}
                              {' · '}{formatDate(injury.date)}
                            </div>
                          </div>
                          <div style={{ color: '#c7c7cc' }} className="flex-shrink-0">›</div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Injury detail modal */}
        {selectedInjuryDetail && (
          <InjuryDetail
            injury={selectedInjuryDetail}
            onUpdateStatus={() => {}}
            onUpdate={() => {}}
            onDelete={() => {}}
            onClose={() => setSelectedInjuryDetail(null)}
            readOnly={true}
            onAdvice={selectedPerson.permission === 'write' ? () => {
              setAdviceTarget(selectedInjuryDetail);
              setSelectedInjuryDetail(null);
            } : undefined}
          />
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="h-full flex flex-col px-4 pt-4" style={{ background: '#f2f2f7' }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: '#1c1c1e' }}>Volgend</h1>
      <p className="text-[13px] mb-5" style={{ color: '#8e8e93' }}>Tik op een persoon om hun blessures te bekijken</p>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
      >
        {watching.map((entry, idx) => {
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
              className="w-full text-left bg-white flex items-center gap-4 px-4 py-4 transition-colors active:bg-gray-50"
              style={{ borderBottom: idx < watching.length - 1 ? '0.5px solid #e5e5ea' : 'none' }}
            >
              {/* Avatar with initials */}
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: '#30d158' }}
              >
                {getInitials(label)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[15px] truncate" style={{ color: '#1c1c1e' }}>{label}</p>
                  {/* Connected dot */}
                  {data && !data.error && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#30d158' }} />
                  )}
                </div>
                <p className="text-[12px]" style={{ color: '#8e8e93' }}>
                  {entry.permission === 'read' ? '👀 Meekijken' : '✏️ Meewerken'}
                </p>
              </div>

              {/* Status */}
              <div className="text-right flex-shrink-0">
                {data?.loading ? (
                  <span className="text-[12px]" style={{ color: '#ff9f0a' }}>Ophalen...</span>
                ) : data?.error ? (
                  <span className="text-[12px]" style={{ color: '#ff453a' }}>Fout</span>
                ) : data ? (
                  <>
                    {activeCount > 0 ? (
                      <span
                        className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-full"
                        style={{ background: 'rgba(255,69,58,0.1)', color: '#ff453a' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ff453a' }} />
                        {activeCount} blessure{activeCount !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[12px] font-medium" style={{ color: '#30d158' }}>✓ Geen actief</span>
                    )}
                    <p className="text-[11px] mt-0.5" style={{ color: '#aeaeb2' }}>{timeAgo(data.updatedAt)}</p>
                  </>
                ) : (
                  <span className="text-[12px]" style={{ color: '#aeaeb2' }}>—</span>
                )}
              </div>

              <span style={{ color: '#c7c7cc' }} className="text-lg">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
