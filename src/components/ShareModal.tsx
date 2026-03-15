import { useState, useEffect, useRef } from 'react';
import type { useSync, WatchEntry } from '../hooks/useSync';

type SyncHook = ReturnType<typeof useSync>;

interface ShareModalProps {
  sync: SyncHook;
  onClose: () => void;
}

const EXPIRY_SECONDS = 5 * 60;

export default function ShareModal({ sync, onClose }: ShareModalProps) {
  const { isSharing, links, watching, startSharing, stopSharing, connectToCode, stopWatching, revokeLink } = sync;

  const [shareCode, setShareCode] = useState<string | null>(null);
  const [sharePermission, setSharePermission] = useState<'read' | 'write'>('read');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(EXPIRY_SECONDS);

  const [codeInput, setCodeInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<WatchEntry | null>(null);

  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shareCode) return;
    setCountdown(EXPIRY_SECONDS);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShareCode(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [shareCode]);

  const handleStartSharing = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const code = await startSharing(sharePermission);
      setShareCode(code);
    } catch (e: unknown) {
      setStartError(e instanceof Error ? e.message : 'Onbekende fout');
    } finally {
      setStarting(false);
    }
  };

  const handleConnect = async () => {
    const cleaned = codeInput.replace(/\D/g, '');
    if (cleaned.length !== 6) {
      setConnectError('Voer een 6-cijferige code in');
      return;
    }
    setConnecting(true);
    setConnectError(null);
    try {
      const entry = await connectToCode(cleaned);
      setConnectSuccess(entry);
      setCodeInput('');
    } catch (e: unknown) {
      setConnectError(e instanceof Error ? e.message : 'Code niet gevonden of verlopen');
    } finally {
      setConnecting(false);
    }
  };

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatCode = (code: string) => `${code.slice(0, 3)} ${code.slice(3, 6)}`;

  const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCodeInput(digits);
    setConnectError(null);
    setConnectSuccess(null);
  };

  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <div
      className="text-[11px] font-semibold uppercase tracking-wider mb-3 px-1"
      style={{ color: '#8e8e93' }}
    >
      {children}
    </div>
  );

  const permissionButtonStyle = (active: boolean) => ({
    flex: 1,
    padding: '10px 12px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500' as const,
    transition: 'all 0.15s',
    background: active ? '#30d158' : '#f2f2f7',
    color: active ? '#fff' : '#8e8e93',
    border: 'none',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white max-h-[92vh] overflow-y-auto"
        style={{ borderRadius: '24px 24px 0 0', boxShadow: '0 -4px 30px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full" style={{ background: '#d1d1d6' }} />
        </div>

        <div className="px-5 pb-10 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#1c1c1e' }}>Delen & Volgen</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium"
              style={{ background: '#e5e5ea', color: '#8e8e93' }}
            >
              ✕
            </button>
          </div>

          {/* ── SHARING SECTION ── */}
          <section className="mb-7">
            <SectionHeader>Jouw data delen</SectionHeader>

            {isSharing ? (
              <div>
                {/* Sharing active badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(48,209,88,0.12)', color: '#30d158' }}
                  >
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#30d158' }} />
                    Je deelt je data
                  </span>
                </div>

                {shareCode ? (
                  /* Pairing code display */
                  <div
                    className="rounded-2xl p-5 text-center mb-4"
                    style={{ background: '#f2f2f7' }}
                  >
                    <p className="text-[12px] mb-2" style={{ color: '#8e8e93' }}>
                      Koppelcode (verloopt in {formatCountdown(countdown)})
                    </p>
                    <div
                      className="text-5xl font-mono font-bold mb-2"
                      style={{ letterSpacing: '0.2em', color: '#1c1c1e' }}
                    >
                      {formatCode(shareCode)}
                    </div>
                    <p className="text-[12px]" style={{ color: '#aeaeb2' }}>De ander voert deze code in op hun telefoon</p>
                    {/* Countdown bar */}
                    <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: '#d1d1d6' }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${(countdown / EXPIRY_SECONDS) * 100}%`, background: '#30d158' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-[15px] mb-4" style={{ color: '#8e8e93' }}>
                      Genereer een koppelcode zodat iemand jouw data kan volgen.
                    </p>
                    <div className="flex gap-2 mb-4">
                      <button style={permissionButtonStyle(sharePermission === 'read')} onClick={() => setSharePermission('read')}>
                        👀 Meekijken
                      </button>
                      <button style={permissionButtonStyle(sharePermission === 'write')} onClick={() => setSharePermission('write')}>
                        ✏️ Meewerken
                      </button>
                    </div>
                    <button
                      onClick={handleStartSharing}
                      disabled={starting}
                      className="w-full py-3.5 rounded-xl text-white font-semibold text-[15px] disabled:opacity-60"
                      style={{ background: '#30d158' }}
                    >
                      {starting ? 'Bezig...' : 'Genereer code'}
                    </button>
                    {startError && <p className="mt-2 text-[12px]" style={{ color: '#ff453a' }}>{startError}</p>}
                  </div>
                )}

                {/* Incoming links */}
                {links.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#8e8e93' }}>
                      Deelt met ({links.length})
                    </p>
                    <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      {links.map((link, idx) => (
                        <div
                          key={link.linkId}
                          className="flex items-center justify-between bg-white px-4 py-3.5"
                          style={{ borderBottom: idx < links.length - 1 ? '0.5px solid #e5e5ea' : 'none' }}
                        >
                          <div>
                            <p className="text-[15px] font-medium" style={{ color: '#1c1c1e' }}>
                              Verbinding {link.linkId.slice(0, 8)}
                            </p>
                            <p className="text-[12px]" style={{ color: '#8e8e93' }}>
                              {link.permission === 'read' ? '👀 Meekijken' : '✏️ Meewerken'} ·{' '}
                              {new Date(link.connectedAt).toLocaleDateString('nl-NL')}
                            </p>
                          </div>
                          <button
                            onClick={() => revokeLink(link.linkId)}
                            className="text-[13px] font-semibold ml-3"
                            style={{ color: '#ff453a' }}
                          >
                            Intrekken
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={stopSharing}
                  className="w-full py-3 rounded-xl text-[14px] font-medium"
                  style={{ background: 'rgba(255,69,58,0.08)', color: '#ff453a' }}
                >
                  Stop Delen
                </button>
              </div>
            ) : (
              /* Not sharing yet */
              <div>
                <p className="text-[15px] mb-4" style={{ color: '#8e8e93' }}>
                  Deel je blessuredata veilig versleuteld met je coach, fysio of teamgenoot.
                </p>

                {!shareCode ? (
                  <>
                    <div className="flex gap-2 mb-4">
                      <button style={permissionButtonStyle(sharePermission === 'read')} onClick={() => setSharePermission('read')}>
                        👀 Meekijken
                      </button>
                      <button style={permissionButtonStyle(sharePermission === 'write')} onClick={() => setSharePermission('write')}>
                        ✏️ Meewerken
                      </button>
                    </div>

                    <button
                      onClick={handleStartSharing}
                      disabled={starting}
                      className="w-full py-3.5 rounded-xl text-white font-bold text-[15px] disabled:opacity-60"
                      style={{ background: '#30d158' }}
                    >
                      {starting ? 'Bezig...' : '🔗 Start Delen'}
                    </button>
                    {startError && <p className="mt-2 text-[12px]" style={{ color: '#ff453a' }}>{startError}</p>}
                  </>
                ) : (
                  <div className="rounded-2xl p-5 text-center" style={{ background: '#f2f2f7' }}>
                    <p className="text-[12px] mb-2" style={{ color: '#8e8e93' }}>
                      Koppelcode (verloopt in {formatCountdown(countdown)})
                    </p>
                    <div
                      className="text-5xl font-mono font-bold mb-2"
                      style={{ letterSpacing: '0.2em', color: '#1c1c1e' }}
                    >
                      {formatCode(shareCode)}
                    </div>
                    <p className="text-[12px]" style={{ color: '#aeaeb2' }}>De ander voert deze code in op hun telefoon</p>
                    <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: '#d1d1d6' }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${(countdown / EXPIRY_SECONDS) * 100}%`, background: '#30d158' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="mb-7" style={{ borderTop: '0.5px solid #e5e5ea' }} />

          {/* ── FOLLOWING SECTION ── */}
          <section>
            <SectionHeader>Iemand volgen</SectionHeader>

            <p className="text-[15px] mb-4" style={{ color: '#8e8e93' }}>
              Voer de code in die de ander heeft gedeeld om hun blessures te bekijken.
            </p>

            {/* Code input */}
            <div className="flex gap-2 mb-4">
              <input
                ref={codeInputRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                value={codeInput}
                onChange={handleCodeInputChange}
                className="flex-1 text-center font-mono font-bold"
                style={{
                  fontSize: '28px',
                  letterSpacing: '0.3em',
                  background: '#f2f2f7',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  outline: 'none',
                  color: '#1c1c1e',
                }}
                maxLength={6}
              />
              <button
                onClick={handleConnect}
                disabled={connecting || codeInput.length !== 6}
                className="px-5 py-3 text-white rounded-xl font-semibold text-[14px] disabled:opacity-50"
                style={{ background: '#30d158' }}
              >
                {connecting ? '...' : 'Koppel'}
              </button>
            </div>

            {connectError && (
              <p className="text-[12px] mb-3" style={{ color: '#ff453a' }}>{connectError}</p>
            )}
            {connectSuccess && (
              <p className="text-[12px] mb-3" style={{ color: '#30d158' }}>
                ✅ Verbonden! Je kunt hun data nu bekijken via het Volgen-tabblad.
              </p>
            )}

            {/* Watched people list */}
            {watching.length > 0 && (
              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#8e8e93' }}>
                  Jij volgt ({watching.length})
                </p>
                <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  {watching.map((w, idx) => (
                    <div
                      key={w.ownerId}
                      className="flex items-center justify-between bg-white px-4 py-3.5"
                      style={{ borderBottom: idx < watching.length - 1 ? '0.5px solid #e5e5ea' : 'none' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: '#30d158' }}
                        >
                          {(w.label ?? `S${w.ownerId.slice(0, 1)}`).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[15px] font-medium" style={{ color: '#1c1c1e' }}>
                            {w.label ?? `Speler ${w.ownerId.slice(0, 8)}`}
                          </p>
                          <p className="text-[12px]" style={{ color: '#8e8e93' }}>
                            {w.permission === 'read' ? '👀 Meekijken' : '✏️ Meewerken'} ·{' '}
                            {new Date(w.connectedAt).toLocaleDateString('nl-NL')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => stopWatching(w.ownerId)}
                        className="text-[13px] font-semibold ml-3"
                        style={{ color: '#ff453a' }}
                      >
                        Stoppen
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
