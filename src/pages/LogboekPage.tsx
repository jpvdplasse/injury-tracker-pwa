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

  return (
    <div className="h-full flex flex-col px-4 pt-3">
      <h1 className="text-lg font-bold text-gray-900 mb-3">Logboek</h1>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-rugby-700 text-white shadow-sm'
                : 'bg-white text-gray-500 hover:text-gray-700 border border-surface-600'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Injury list */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🏉</div>
            <p className="text-sm">Geen blessures gevonden</p>
          </div>
        ) : (
          filtered.map(injury => {
            const zone = getBodyZone(injury.bodyZoneId);
            return (
              <button
                key={injury.id}
                onClick={() => setSelectedInjury(injury)}
                className="w-full bg-white hover:bg-surface-700 rounded-xl p-4 flex items-center gap-3 transition-colors text-left shadow-sm border border-surface-600"
              >
                {/* Severity dot */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${SEVERITY_COLORS[injury.severity]}18`,
                  }}
                >
                  <span
                    className="text-lg font-bold"
                    style={{ color: SEVERITY_COLORS[injury.severity] }}
                  >
                    {injury.severity}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {zone?.nameNl || injury.bodyZoneId}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{
                        backgroundColor: `${STATUS_COLORS[injury.status]}18`,
                        color: STATUS_COLORS[injury.status],
                      }}
                    >
                      {STATUS_LABELS[injury.status]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                    <span>
                      {INJURY_TYPES[injury.type].nl}
                      {injury.subLocation && ` · ${injury.subLocation}`}
                      {' · '}{formatDate(injury.date)}
                    </span>
                    {injury.advices && injury.advices.length > 0 && (
                      <span title={`${injury.advices.length} advies/adviezen`} className="text-xs">💬</span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-gray-300 flex-shrink-0">›</div>
              </button>
            );
          })
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
