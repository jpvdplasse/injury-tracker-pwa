import { useState } from 'react';
import type { Injury, InjuryStatus } from '../types';
import { INJURY_TYPES, SEVERITY_COLORS, STATUS_COLORS, STATUS_LABELS, getBodyZone } from '../types';
import InjuryDetail from '../components/InjuryDetail';

interface LogboekPageProps {
  injuries: Injury[];
  onUpdateStatus: (id: string, status: InjuryStatus) => void;
  onUpdate: (id: string, updates: Partial<Injury>) => void;
  onDelete: (id: string) => void;
}

type FilterTab = 'all' | 'active' | 'recovering' | 'healed';

export default function LogboekPage({ injuries, onUpdateStatus, onUpdate, onDelete }: LogboekPageProps) {
  const [selectedInjury, setSelectedInjury] = useState<Injury | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = filter === 'all'
    ? injuries
    : injuries.filter(i => i.status === filter);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'Alles', count: injuries.length },
    { key: 'active', label: 'Actief', count: injuries.filter(i => i.status === 'active').length },
    { key: 'recovering', label: 'Herstel', count: injuries.filter(i => i.status === 'recovering').length },
    { key: 'healed', label: 'Genezen', count: injuries.filter(i => i.status === 'healed').length },
  ];

  // Group filtered injuries by month
  const grouped: { label: string; injuries: Injury[] }[] = [];
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  sorted.forEach(injury => {
    const monthLabel = new Date(injury.date).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
    const existing = grouped.find(g => g.label === monthLabel);
    if (existing) {
      existing.injuries.push(injury);
    } else {
      grouped.push({ label: monthLabel, injuries: [injury] });
    }
  });

  return (
    <div className="h-full flex flex-col px-4 pt-4" style={{ background: '#f2f2f7' }}>
      {/* Apple Health large title */}
      <h1 className="text-2xl font-bold mb-4" style={{ color: '#1c1c1e' }}>Logboek</h1>

      {/* Filter chips — pill-shaped */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-0.5">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all"
            style={
              filter === tab.key
                ? { background: '#30d158', color: '#fff' }
                : { background: '#e5e5ea', color: '#8e8e93' }
            }
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Injury list — grouped by month */}
      <div className="flex-1 overflow-y-auto pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: '#8e8e93' }}>
            <div className="text-4xl mb-3">📋</div>
            <p className="text-[15px]">Geen blessures gevonden</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.label} className="mb-4">
              {/* Section header — Apple grouped style */}
              <div
                className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1"
                style={{ color: '#8e8e93' }}
              >
                {group.label}
              </div>

              {/* Grouped cards */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
              >
                {group.injuries.map((injury, idx) => {
                  const zone = getBodyZone(injury.bodyZoneId);
                  return (
                    <button
                      key={injury.id}
                      onClick={() => setSelectedInjury(injury)}
                      className="w-full bg-white flex items-center gap-0 text-left transition-colors active:bg-gray-50"
                      style={{
                        borderBottom: idx < group.injuries.length - 1 ? '0.5px solid #e5e5ea' : 'none',
                      }}
                    >
                      {/* Left severity bar */}
                      <div
                        className="w-1 self-stretch flex-shrink-0"
                        style={{
                          background: SEVERITY_COLORS[injury.severity],
                          minHeight: 60,
                          borderRadius: idx === 0
                            ? (group.injuries.length === 1 ? '16px 0 0 16px' : '16px 0 0 0')
                            : (idx === group.injuries.length - 1 ? '0 0 0 16px' : '0'),
                        }}
                      />

                      <div className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3.5">
                        {/* Severity circle */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                          style={{
                            backgroundColor: `${SEVERITY_COLORS[injury.severity]}18`,
                            color: SEVERITY_COLORS[injury.severity],
                          }}
                        >
                          {injury.severity}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[15px] font-medium truncate" style={{ color: '#1c1c1e' }}>
                              {zone?.nameNl || injury.bodyZoneId}
                            </span>
                            <span
                              className="text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                              style={{
                                backgroundColor: `${STATUS_COLORS[injury.status]}18`,
                                color: STATUS_COLORS[injury.status],
                              }}
                            >
                              {STATUS_LABELS[injury.status]}
                            </span>
                            {injury.advices && injury.advices.length > 0 && (
                              <span className="text-xs">💬</span>
                            )}
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
            </div>
          ))
        )}
      </div>

      {/* Detail modal */}
      {selectedInjury && (
        <InjuryDetail
          injury={selectedInjury}
          onUpdateStatus={(id, status) => {
            onUpdateStatus(id, status);
            setSelectedInjury({ ...selectedInjury, status });
          }}
          onUpdate={(id, updates) => {
            onUpdate(id, updates);
            setSelectedInjury({ ...selectedInjury, ...updates } as Injury);
          }}
          onDelete={onDelete}
          onClose={() => setSelectedInjury(null)}
        />
      )}
    </div>
  );
}
