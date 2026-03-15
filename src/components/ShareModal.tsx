import { useState, useEffect, useRef } from 'react';
import type { useSync, WatchEntry } from '../hooks/useSync';

type SyncHook = ReturnType<typeof useSync>;

interface ShareModalProps {
  sync: SyncHook;
  onClose: () => void;
}

const EXPIRY_SECONDS = 5 * 60; // 5 minutes

export default function ShareModal({ sync, onClose }: ShareModalProps) {
  const { isSharing, watching, startSharing, stopSharing, connectToCode, stopWatching } = sync;

  // Sharing section state
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [sharePermission, setSharePermission] = useState<'read' | 'write'>('read');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(EXPIRY_SECONDS);

  // Connect section state
  const [codeInput, setCodeInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<WatchEntry | null>(null);

  const codeInputRef = useRef<HTMLInputElement>(null);

  // Countdown timer when code is shown
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

  const formatCode = (code: string) => {
    // Display as "123 456"
    return `${code.slice(0, 3)} ${code.slice(3, 6)}`;
  };

  const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCodeInput(digits);
    setConnectError(null);
    setConnectSuccess(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      {/* Bottom sheet */}
      <div
        className="bg-white rounded-t-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Delen & Volgen</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* ── SHARING SECTION ── */}
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Jouw data delen
            </h3>

            {isSharing ? (
              /* Already sharing */
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 text-sm font-medium px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Je deelt je data
                  </span>
                </div>

                {shareCode ? (
                  /* Show the pairing code */
                  <div className="bg-gray-50 rounded-xl p-4 text-center mb-4">
                    <p className="text-xs text-gray-500 mb-2">Koppelcode (verloopt in {formatCountdown(countdown)})</p>
                    <div className="text-5xl font-mono font-bold tracking-[0.25em] text-gray-900 mb-2">
                      {formatCode(shareCode)}
                    </div>
                    <p className="text-xs text-gray-400">De ander voert deze code in op hun telefoon</p>
                  </div>
                ) : (
                  /* Generate a new code */
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-3">Genereer een koppelcode zodat iemand jouw data kan volgen.</p>
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setSharePermission('read')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                          sharePermission === 'read'
                            ? 'bg-rugby-700 text-white border-rugby-700'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        👀 Meekijken
                      </button>
                      <button
                        onClick={() => setSharePermission('write')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                          sharePermission === 'write'
                            ? 'bg-rugby-700 text-white border-rugby-700'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        ✏️ Meewerken
                      </button>
                    </div>
                    <button
                      onClick={handleStartSharing}
                      disabled={starting}
                      className="w-full py-3 rounded-xl bg-rugby-700 text-white font-semibold text-base active:scale-95 transition-transform disabled:opacity-60"
                    >
                      {starting ? 'Bezig...' : 'Genereer code'}
                    </button>
                    {startError && <p className="mt-2 text-xs text-red-600">{startError}</p>}
                  </div>
                )}

                <button
                  onClick={stopSharing}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Stop Delen
                </button>
              </div>
            ) : (
              /* Not sharing yet */
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Deel je blessuredata veilig versleuteld met je coach, fysio of teamgenoot.
                </p>

                {!shareCode ? (
                  <>
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setSharePermission('read')}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors ${
                          sharePermission === 'read'
                            ? 'bg-rugby-700 text-white border-rugby-700'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        👀 Meekijken
                      </button>
                      <button
                        onClick={() => setSharePermission('write')}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors ${
                          sharePermission === 'write'
                            ? 'bg-rugby-700 text-white border-rugby-700'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        ✏️ Meewerken
                      </button>
                    </div>

                    <button
                      onClick={handleStartSharing}
                      disabled={starting}
                      className="w-full py-4 rounded-xl bg-rugby-700 text-white font-bold text-lg active:scale-95 transition-transform disabled:opacity-60 shadow-sm"
                    >
                      {starting ? 'Bezig...' : '🔗 Start Delen'}
                    </button>
                    {startError && <p className="mt-2 text-xs text-red-600">{startError}</p>}
                  </>
                ) : (
                  /* Show code after starting */
                  <div className="bg-gray-50 rounded-xl p-5 text-center">
                    <p className="text-xs text-gray-500 mb-2">Koppelcode (verloopt in {formatCountdown(countdown)})</p>
                    <div className="text-5xl font-mono font-bold tracking-[0.25em] text-gray-900 mb-3">
                      {formatCode(shareCode)}
                    </div>
                    <p className="text-xs text-gray-400">De ander voert deze code in op hun telefoon</p>
                    <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rugby-700 transition-all duration-1000"
                        style={{ width: `${(countdown / EXPIRY_SECONDS) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="border-t border-gray-100 mb-6" />

          {/* ── FOLLOWING SECTION ── */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Iemand volgen
            </h3>

            <p className="text-sm text-gray-600 mb-4">
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
                className="flex-1 text-center text-2xl font-mono font-bold tracking-[0.3em] border-2 border-gray-200 rounded-xl py-3 focus:border-rugby-700 focus:outline-none transition-colors"
                maxLength={6}
              />
              <button
                onClick={handleConnect}
                disabled={connecting || codeInput.length !== 6}
                className="px-5 py-3 bg-rugby-700 text-white rounded-xl font-semibold text-sm active:scale-95 transition-all disabled:opacity-50"
              >
                {connecting ? '...' : 'Koppel'}
              </button>
            </div>

            {connectError && (
              <p className="text-xs text-red-600 mb-3">{connectError}</p>
            )}
            {connectSuccess && (
              <p className="text-xs text-green-700 mb-3">
                ✅ Verbonden! Je kunt hun data nu bekijken via het Volgen-tabblad.
              </p>
            )}

            {/* Watched people list */}
            {watching.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Jij volgt ({watching.length})</p>
                <div className="space-y-2">
                  {watching.map(w => (
                    <div
                      key={w.ownerId}
                      className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {w.label ?? `Speler ${w.ownerId.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {w.permission === 'read' ? '👀 Meekijken' : '✏️ Meewerken'} ·{' '}
                          {new Date(w.connectedAt).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      <button
                        onClick={() => stopWatching(w.ownerId)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium ml-3"
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
