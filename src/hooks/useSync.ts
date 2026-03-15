import { useState, useCallback, useEffect } from 'react';
import { encryptData, decryptData } from '../utils/crypto';
import type { Injury } from '../types';

const API_BASE = 'https://injure-sync.jeanpaul.workers.dev';

// localStorage keys
const KEY_OWNER_ID = 'injure_owner_id';
const KEY_ENCRYPTION_KEY = 'injure_encryption_key';
const KEY_LINKS = 'injure_links';
const KEY_WATCHING = 'injure_watching';

export interface SyncLink {
  linkId: string;
  permission: 'read' | 'write';
  connectedAt: string;
}

export interface WatchEntry {
  ownerId: string;
  encryptionKey: string;
  permission: 'read' | 'write';
  connectedAt: string;
  label?: string; // optional human-readable label
}

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useSync(injuries: Injury[]) {
  const [ownerId, setOwnerId] = useState<string | null>(() => localStorage.getItem(KEY_OWNER_ID));
  const [encryptionKey, setEncryptionKey] = useState<string | null>(() => localStorage.getItem(KEY_ENCRYPTION_KEY));
  const [links, setLinks] = useState<SyncLink[]>(() => load<SyncLink[]>(KEY_LINKS, []));
  const [watching, setWatching] = useState<WatchEntry[]>(() => load<WatchEntry[]>(KEY_WATCHING, []));

  const isSharing = ownerId !== null && encryptionKey !== null;

  /** Start sharing — calls POST /pair, returns 6-digit code */
  const startSharing = useCallback(async (permission: 'read' | 'write'): Promise<string> => {
    const res = await fetch(`${API_BASE}/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission }),
    });
    if (!res.ok) throw new Error(`Pair failed: ${res.status}`);
    const data = await res.json() as { code: string; encryptionKey: string; ownerId: string };

    localStorage.setItem(KEY_OWNER_ID, data.ownerId);
    localStorage.setItem(KEY_ENCRYPTION_KEY, data.encryptionKey);
    setOwnerId(data.ownerId);
    setEncryptionKey(data.encryptionKey);

    return data.code;
  }, []);

  /** Stop sharing — clears all owner data */
  const stopSharing = useCallback(() => {
    localStorage.removeItem(KEY_OWNER_ID);
    localStorage.removeItem(KEY_ENCRYPTION_KEY);
    localStorage.removeItem(KEY_LINKS);
    setOwnerId(null);
    setEncryptionKey(null);
    setLinks([]);
  }, []);

  /** Connect to someone's share code */
  const connectToCode = useCallback(async (code: string): Promise<WatchEntry> => {
    const res = await fetch(`${API_BASE}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Activate failed: ${res.status} — ${body}`);
    }
    const data = await res.json() as {
      ownerId: string;
      linkId: string;
      encryptionKey: string;
      permission: 'read' | 'write';
    };

    const entry: WatchEntry = {
      ownerId: data.ownerId,
      encryptionKey: data.encryptionKey,
      permission: data.permission,
      connectedAt: new Date().toISOString(),
    };

    setWatching(prev => {
      // Avoid duplicates
      const updated = [...prev.filter(w => w.ownerId !== entry.ownerId), entry];
      save(KEY_WATCHING, updated);
      return updated;
    });

    return entry;
  }, []);

  /** Remove a watched person */
  const stopWatching = useCallback((ownerId: string) => {
    setWatching(prev => {
      const updated = prev.filter(w => w.ownerId !== ownerId);
      save(KEY_WATCHING, updated);
      return updated;
    });
  }, []);

  /** Push encrypted injury data to sync API */
  const pushData = useCallback(async (injuries: Injury[]) => {
    if (!ownerId || !encryptionKey) return;
    const encryptedData = await encryptData(injuries, encryptionKey);
    const res = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, encryptedData }),
    });
    if (!res.ok) throw new Error(`Sync push failed: ${res.status}`);
  }, [ownerId, encryptionKey]);

  /** Pull and decrypt another person's injury data */
  const pullData = useCallback(async (watchOwnerId: string, watchKey: string): Promise<{ injuries: Injury[]; updatedAt: string | null }> => {
    const res = await fetch(`${API_BASE}/sync/${watchOwnerId}`);
    if (res.status === 404) return { injuries: [], updatedAt: null };
    if (!res.ok) throw new Error(`Sync pull failed: ${res.status}`);
    const data = await res.json() as { encryptedData: string | null; updatedAt: string };
    if (!data.encryptedData) return { injuries: [], updatedAt: data.updatedAt };
    const decrypted = await decryptData(data.encryptedData, watchKey);
    return { injuries: decrypted as Injury[], updatedAt: data.updatedAt };
  }, []);

  // Auto-push whenever injuries change and sharing is active
  useEffect(() => {
    if (!isSharing) return;
    // Debounce: push after 1s of no changes
    const timer = setTimeout(() => {
      pushData(injuries).catch(console.error);
    }, 1000);
    return () => clearTimeout(timer);
  }, [injuries, isSharing, pushData]);

  return {
    isSharing,
    ownerId,
    encryptionKey,
    links,
    watching,
    startSharing,
    stopSharing,
    connectToCode,
    stopWatching,
    pushData,
    pullData,
  };
}
