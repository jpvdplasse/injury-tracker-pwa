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
  };
}
