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

  return (
    <div className="h-full overflow-y-auto px-4 pt-3 pb-4">
      <h1 className="text-lg font-bold text-white mb-4">Statistieken</h1>

      {injuries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm">Nog geen blessures geregistreerd</p>
          <p className="text-xs mt-1 text-gray-600">Begin met het loggen van blessures op de Body Map</p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-surface-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{injuries.length}</div>
              <div className="text-xs text-gray-400">Totaal Blessures</div>
            </div>
            <div className="bg-surface-800 rounded-xl p-4">
              <div className="text-2xl font-bold" style={{ color: SEVERITY_COLORS[Math.round(parseFloat(avgSeverity)) as 1|2|3|4|5] || '#fff' }}>
                {avgSeverity}
              </div>
              <div className="text-xs text-gray-400">Gem. Ernst</div>
            </div>
          </div>

          {/* Status overview */}
          <div className="bg-surface-800 rounded-xl p-4 mb-4">
            <div className="text-sm font-medium text-gray-300 mb-3">Status Overzicht</div>
            <div className="flex gap-3">
              {(['active', 'recovering', 'healed'] as const).map(status => {
                const count = status === 'active' ? activeCount : status === 'recovering' ? recoveringCount : healedCount;
                const pct = injuries.length > 0 ? (count / injuries.length * 100) : 0;
                return (
                  <div key={status} className="flex-1 text-center">
                    <div
                      className="text-xl font-bold"
                      style={{ color: STATUS_COLORS[status] }}
                    >
                      {count}
                    </div>
                    <div className="text-[10px] text-gray-400 mb-1.5">{STATUS_LABELS[status]}</div>
                    <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
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
          </div>

          {/* Body Region Chart */}
          <div className="bg-surface-800 rounded-xl p-4 mb-4">
            <div className="text-sm font-medium text-gray-300 mb-3">Per Lichaamsdeel</div>
            <div className="space-y-2.5">
              {Object.entries(regionLabels).map(([region, label]) => {
                const count = regionCounts[region] || 0;
                const pct = (count / maxRegionCount) * 100;
                return (
                  <div key={region}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300">{label}</span>
                      <span className="text-gray-400">{count}</span>
                    </div>
                    <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rugby-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Body Parts */}
          {topBodyParts.length > 0 && (
            <div className="bg-surface-800 rounded-xl p-4 mb-4">
              <div className="text-sm font-medium text-gray-300 mb-3">Meest Kwetsbare Zones</div>
              <div className="space-y-2">
                {topBodyParts.map(([zoneId, count], i) => {
                  const zone = getBodyZone(zoneId);
                  return (
                    <div key={zoneId} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-4">{i + 1}.</span>
                      <span className="text-sm text-gray-200 flex-1">{zone?.nameNl || zoneId}</span>
                      <span className="text-sm font-medium text-rugby-400">{count}×</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Injury Types */}
          {topTypes.length > 0 && (
            <div className="bg-surface-800 rounded-xl p-4 mb-4">
              <div className="text-sm font-medium text-gray-300 mb-3">Type Blessures</div>
              <div className="space-y-2">
                {topTypes.map(([type, count]) => {
                  const typeInfo = INJURY_TYPES[type as keyof typeof INJURY_TYPES];
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">{typeInfo?.nl || type}</span>
                      <span className="text-sm font-medium text-rugby-400">{count}×</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Context Breakdown */}
          <div className="bg-surface-800 rounded-xl p-4 mb-4">
            <div className="text-sm font-medium text-gray-300 mb-3">Context</div>
            <div className="flex gap-2">
              <div className="flex-1 bg-surface-700 rounded-lg p-3 text-center">
                <div className="text-lg">🏋️</div>
                <div className="text-lg font-bold text-white">{contextCounts.training}</div>
                <div className="text-[10px] text-gray-400">Training</div>
              </div>
              <div className="flex-1 bg-surface-700 rounded-lg p-3 text-center">
                <div className="text-lg">🏉</div>
                <div className="text-lg font-bold text-white">{contextCounts.wedstrijd}</div>
                <div className="text-[10px] text-gray-400">Wedstrijd</div>
              </div>
              <div className="flex-1 bg-surface-700 rounded-lg p-3 text-center">
                <div className="text-lg">📋</div>
                <div className="text-lg font-bold text-white">{contextCounts.overig}</div>
                <div className="text-[10px] text-gray-400">Overig</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
