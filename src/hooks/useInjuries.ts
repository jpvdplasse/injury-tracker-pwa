import { useState, useCallback, useEffect } from 'react';
import type { Injury, InjuryStatus } from '../types';

const STORAGE_KEY = 'blessure-logboek-injuries';

function loadInjuries(): Injury[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveInjuries(injuries: Injury[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(injuries));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useInjuries() {
  const [injuries, setInjuries] = useState<Injury[]>(loadInjuries);

  useEffect(() => {
    saveInjuries(injuries);
  }, [injuries]);

  const addInjury = useCallback((injury: Omit<Injury, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'recoveryNotes' | 'recoveryDate'>) => {
    const now = new Date().toISOString();
    const newInjury: Injury = {
      ...injury,
      id: generateId(),
      status: 'active',
      recoveryNotes: '',
      recoveryDate: null,
      createdAt: now,
      updatedAt: now,
    };
    setInjuries(prev => [newInjury, ...prev]);
    return newInjury;
  }, []);

  const updateInjury = useCallback((id: string, updates: Partial<Injury>) => {
    setInjuries(prev =>
      prev.map(injury =>
        injury.id === id
          ? { ...injury, ...updates, updatedAt: new Date().toISOString() }
          : injury
      )
    );
  }, []);

  const updateStatus = useCallback((id: string, status: InjuryStatus) => {
    const updates: Partial<Injury> = { status };
    if (status === 'healed') {
      updates.recoveryDate = new Date().toISOString().split('T')[0];
    }
    setInjuries(prev =>
      prev.map(injury =>
        injury.id === id
          ? { ...injury, ...updates, updatedAt: new Date().toISOString() }
          : injury
      )
    );
  }, []);

  const deleteInjury = useCallback((id: string) => {
    setInjuries(prev => prev.filter(injury => injury.id !== id));
  }, []);

  /** Merge remote injuries — picks up advice/updates from collaborators without overwriting local changes */
  const mergeRemote = useCallback((remoteInjuries: Injury[]) => {
    setInjuries(prev => {
      let changed = false;
      const merged = prev.map(local => {
        const remote = remoteInjuries.find(r => r.id === local.id);
        if (!remote) return local;

        // Merge advices arrays: combine both, deduplicate by date+text
        const localAdvices = local.advices ?? [];
        const remoteAdvices = remote.advices ?? [];
        const seen = new Set(localAdvices.map(a => `${a.date}|${a.text}`));
        const newAdvices = remoteAdvices.filter(a => !seen.has(`${a.date}|${a.text}`));
        if (newAdvices.length > 0) {
          changed = true;
          return { ...local, advices: [...localAdvices, ...newAdvices] };
        }
        return local;
      });
      // Also add any injuries that exist remotely but not locally (added by fysio)
      const localIds = new Set(prev.map(i => i.id));
      const newFromRemote = remoteInjuries.filter(r => !localIds.has(r.id));
      if (newFromRemote.length > 0) changed = true;

      return changed || newFromRemote.length > 0 ? [...merged, ...newFromRemote] : prev;
    });
  }, []);

  const activeInjuries = injuries.filter(i => i.status !== 'healed');
  const healedInjuries = injuries.filter(i => i.status === 'healed');

  return {
    injuries,
    activeInjuries,
    healedInjuries,
    addInjury,
    updateInjury,
    updateStatus,
    deleteInjury,
    mergeRemote,
  };
}
