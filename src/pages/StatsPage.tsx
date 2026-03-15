import type { Injury } from '../types';
import { INJURY_TYPES, SEVERITY_COLORS, STATUS_COLORS, STATUS_LABELS, getBodyZone } from '../types';

interface StatsPageProps {
  injuries: Injury[];
}

export default function StatsPage({ injuries }: StatsPageProps) {
  const activeCount = injuries.filter(i => i.status === 'active').length;
  const recoveringCount = injuries.filter(i => i.status === 'recovering').length;
  const healedCount = injuries.filter(i => i.status === 'healed').length;

  // Injuries per body region
  const regionCounts: Record<string, number> = {};
  injuries.forEach(i => {
    const zone = getBodyZone(i.bodyZoneId);
    const region = zone?.region || 'unknown';
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });

  const regionLabels: Record<string, string> = {
    head: '🧠 Hoofd & Nek',
    torso: '💪 Romp',
    arms: '🤲 Armen',
    legs: '🦵 Benen',
  };

  // Most injured body parts
  const bodyPartCounts: Record<string, number> = {};
  injuries.forEach(i => {
    bodyPartCounts[i.bodyZoneId] = (bodyPartCounts[i.bodyZoneId] || 0) + 1;
  });
  const topBodyParts = Object.entries(bodyPartCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Most common injury types
  const typeCounts: Record<string, number> = {};
  injuries.forEach(i => {
    typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
  });
  const topTypes = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Average severity
  const avgSeverity = injuries.length > 0
    ? (injuries.reduce((sum, i) => sum + i.severity, 0) / injuries.length).toFixed(1)
    : '0';

  // Context breakdown
  const contextCounts = {
    training: injuries.filter(i => i.context === 'training').length,
    wedstrijd: injuries.filter(i => i.context === 'wedstrijd').length,
    overig: injuries.filter(i => i.context === 'overig').length,
  };

  const maxRegionCount = Math.max(...Object.values(regionCounts), 1);

  // Apple-style card
  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div
      className={`bg-white rounded-2xl p-4 mb-4 ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      {children}
    </div>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div
      className="text-[11px] font-semibold uppercase tracking-wider mb-3"
      style={{ color: '#8e8e93' }}
    >
      {children}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto px-4 pt-4 pb-4" style={{ background: '#f2f2f7' }}>
      {/* Apple Health large title */}
      <h1 className="text-2xl font-bold mb-5" style={{ color: '#1c1c1e' }}>Statistieken</h1>

      {injuries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: '#8e8e93' }}>
          <div className="text-4xl mb-3">📊</div>
          <p className="text-[15px]">Nog geen blessures geregistreerd</p>
          <p className="text-[13px] mt-1" style={{ color: '#aeaeb2' }}>Begin met het loggen van blessures op de Body Map</p>
        </div>
      ) : (
        <>
          {/* Overview — 2x2 grid with large numbers */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div
              className="bg-white rounded-2xl p-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            >
              <div className="text-3xl font-bold mb-0.5" style={{ color: '#30d158' }}>{injuries.length}</div>
              <div className="text-[12px]" style={{ color: '#8e8e93' }}>Totaal Blessures</div>
            </div>
            <div
              className="bg-white rounded-2xl p-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            >
              <div
                className="text-3xl font-bold mb-0.5"
                style={{ color: SEVERITY_COLORS[Math.round(parseFloat(avgSeverity)) as 1|2|3|4|5] || '#1c1c1e' }}
              >
                {avgSeverity}
              </div>
              <div className="text-[12px]" style={{ color: '#8e8e93' }}>Gem. Ernst</div>
            </div>
            <div
              className="bg-white rounded-2xl p-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            >
              <div className="text-3xl font-bold mb-0.5" style={{ color: STATUS_COLORS['active'] }}>{activeCount}</div>
              <div className="text-[12px]" style={{ color: '#8e8e93' }}>Actief</div>
            </div>
            <div
              className="bg-white rounded-2xl p-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            >
              <div className="text-3xl font-bold mb-0.5" style={{ color: '#30d158' }}>{healedCount}</div>
              <div className="text-[12px]" style={{ color: '#8e8e93' }}>Genezen</div>
            </div>
          </div>

          {/* Status overview */}
          <Card>
            <SectionLabel>Status Overzicht</SectionLabel>
            <div className="flex gap-3">
              {(['active', 'recovering', 'healed'] as const).map(status => {
                const count = status === 'active' ? activeCount : status === 'recovering' ? recoveringCount : healedCount;
                const pct = injuries.length > 0 ? (count / injuries.length * 100) : 0;
                return (
                  <div key={status} className="flex-1 text-center">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: STATUS_COLORS[status] }}
                    >
                      {count}
                    </div>
                    <div className="text-[11px] mb-2" style={{ color: '#8e8e93' }}>{STATUS_LABELS[status]}</div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: '#f2f2f7' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: STATUS_COLORS[status],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Body Region Chart */}
          <Card>
            <SectionLabel>Per Lichaamsdeel</SectionLabel>
            <div className="space-y-3">
              {Object.entries(regionLabels).map(([region, label]) => {
                const count = regionCounts[region] || 0;
                const pct = (count / maxRegionCount) * 100;
                return (
                  <div key={region}>
                    <div className="flex justify-between text-[13px] mb-1.5">
                      <span style={{ color: '#1c1c1e' }}>{label}</span>
                      <span style={{ color: '#8e8e93' }}>{count}</span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: '#f2f2f7' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: '#30d158' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Body Parts */}
          {topBodyParts.length > 0 && (
            <div
              className="bg-white rounded-2xl overflow-hidden mb-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            >
              <div className="px-4 pt-4 pb-2">
                <SectionLabel>Meest Kwetsbare Zones</SectionLabel>
              </div>
              {topBodyParts.map(([zoneId, count], i) => {
                const zone = getBodyZone(zoneId);
                return (
                  <div
                    key={zoneId}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: i > 0 ? '0.5px solid #e5e5ea' : 'none' }}
                  >
                    <span className="text-[13px] w-5 text-center" style={{ color: '#aeaeb2' }}>{i + 1}</span>
                    <span className="text-[15px] flex-1" style={{ color: '#1c1c1e' }}>{zone?.nameNl || zoneId}</span>
                    <span className="text-[15px] font-semibold" style={{ color: '#30d158' }}>{count}×</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Injury Types */}
          {topTypes.length > 0 && (
            <div
              className="bg-white rounded-2xl overflow-hidden mb-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            >
              <div className="px-4 pt-4 pb-2">
                <SectionLabel>Type Blessures</SectionLabel>
              </div>
              {topTypes.map(([type, count], i) => {
                const typeInfo = INJURY_TYPES[type as keyof typeof INJURY_TYPES];
                return (
                  <div
                    key={type}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderTop: i > 0 ? '0.5px solid #e5e5ea' : 'none' }}
                  >
                    <span className="text-[15px]" style={{ color: '#1c1c1e' }}>{typeInfo?.nl || type}</span>
                    <span className="text-[15px] font-semibold" style={{ color: '#30d158' }}>{count}×</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Context Breakdown */}
          <Card>
            <SectionLabel>Context</SectionLabel>
            <div className="flex gap-3">
              {[
                { emoji: '🏋️', count: contextCounts.training, label: 'Training' },
                { emoji: '🏉', count: contextCounts.wedstrijd, label: 'Wedstrijd' },
                { emoji: '📋', count: contextCounts.overig, label: 'Overig' },
              ].map(item => (
                <div
                  key={item.label}
                  className="flex-1 rounded-xl p-3 text-center"
                  style={{ background: '#f2f2f7' }}
                >
                  <div className="text-xl mb-1">{item.emoji}</div>
                  <div className="text-xl font-bold" style={{ color: '#1c1c1e' }}>{item.count}</div>
                  <div className="text-[11px]" style={{ color: '#8e8e93' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recovery stat */}
          {healedCount > 0 && (
            <Card>
              <SectionLabel>Herstel Ratio</SectionLabel>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold" style={{ color: '#30d158' }}>
                  {Math.round((healedCount / injuries.length) * 100)}%
                </div>
                <div>
                  <div className="text-[15px]" style={{ color: '#1c1c1e' }}>Genezen</div>
                  <div className="text-[13px]" style={{ color: '#8e8e93' }}>{healedCount} van {injuries.length} blessures</div>
                </div>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden mt-3"
                style={{ background: '#f2f2f7' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(healedCount / injuries.length) * 100}%`,
                    background: '#30d158',
                  }}
                />
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
