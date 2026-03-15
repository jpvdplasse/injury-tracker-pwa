import React, { useState } from 'react';
import { useInjuries } from './hooks/useInjuries';
import { useSync } from './hooks/useSync';
import BodyMapPage from './pages/BodyMapPage';
import LogboekPage from './pages/LogboekPage';
import StatsPage from './pages/StatsPage';
import FollowingPage from './pages/FollowingPage';
import ShareModal from './components/ShareModal';

type Tab = 'bodymap' | 'logboek' | 'stats' | 'volgen';

// SVG icons for Apple Health-style bottom nav
const TabIcons: Record<Tab | 'delen', (active: boolean) => React.ReactElement> = {
  bodymap: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C9.5 2 8 4 8 6C8 8.5 9.5 10 12 10C14.5 10 16 8.5 16 6C16 4 14.5 2 12 2Z" fill={active ? '#30d158' : '#8e8e93'} />
      <path d="M5 14C5 12 7 11 9 11H15C17 11 19 12 19 14V20C19 21 18 22 17 22H7C6 22 5 21 5 20V14Z" fill={active ? '#30d158' : '#8e8e93'} opacity="0.7" />
    </svg>
  ),
  logboek: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="3" width="16" height="18" rx="3" fill={active ? '#30d158' : '#8e8e93'} opacity="0.15" stroke={active ? '#30d158' : '#8e8e93'} strokeWidth="1.5" />
      <path d="M8 8H16M8 12H16M8 16H12" stroke={active ? '#30d158' : '#8e8e93'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  stats: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="14" width="4" height="7" rx="1.5" fill={active ? '#30d158' : '#8e8e93'} />
      <rect x="10" y="9" width="4" height="12" rx="1.5" fill={active ? '#30d158' : '#8e8e93'} opacity="0.7" />
      <rect x="17" y="4" width="4" height="17" rx="1.5" fill={active ? '#30d158' : '#8e8e93'} opacity="0.4" />
    </svg>
  ),
  volgen: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="7" r="3.5" fill={active ? '#30d158' : '#8e8e93'} opacity="0.7" />
      <circle cx="16" cy="8" r="2.5" fill={active ? '#30d158' : '#8e8e93'} opacity="0.4" />
      <path d="M3 19C3 16 5.5 14 9 14C12.5 14 15 16 15 19" stroke={active ? '#30d158' : '#8e8e93'} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 14C18.5 14 21 15.5 21 18" stroke={active ? '#30d158' : '#8e8e93'} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  ),
  delen: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="5" r="3" fill={active ? '#30d158' : '#8e8e93'} />
      <circle cx="6" cy="12" r="3" fill={active ? '#30d158' : '#8e8e93'} opacity="0.7" />
      <circle cx="18" cy="19" r="3" fill={active ? '#30d158' : '#8e8e93'} opacity="0.4" />
      <path d="M8.6 10.7L15.4 6.8M8.6 13.3L15.4 17.2" stroke={active ? '#30d158' : '#8e8e93'} strokeWidth="1.5" />
    </svg>
  ),
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('bodymap');
  const [showShareModal, setShowShareModal] = useState(false);
  const { injuries, addInjury, updateInjury, updateStatus, deleteInjury, mergeRemote } = useInjuries();
  const sync = useSync(injuries, mergeRemote);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'bodymap', label: 'Body Map' },
    { key: 'logboek', label: 'Logboek' },
    { key: 'stats', label: 'Stats' },
    { key: 'volgen', label: 'Volgen' },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: '#f2f2f7' }}>
      {/* Page content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'bodymap' && (
          <BodyMapPage injuries={injuries} onAddInjury={addInjury} onUpdateStatus={updateStatus} onUpdate={updateInjury} onDelete={deleteInjury} />
        )}
        {activeTab === 'logboek' && (
          <LogboekPage
            injuries={injuries}
            onUpdateStatus={updateStatus}
            onUpdate={updateInjury}
            onDelete={deleteInjury}
          />
        )}
        {activeTab === 'stats' && (
          <StatsPage injuries={injuries} />
        )}
        {activeTab === 'volgen' && (
          <FollowingPage sync={sync} />
        )}
      </div>

      {/* Bottom navigation — Apple style */}
      <nav
        className="bg-white border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex flex-col items-center pt-2 pb-1.5 transition-colors"
              >
                {TabIcons[tab.key](isActive)}
                <span
                  className="text-[10px] font-medium mt-0.5"
                  style={{ color: isActive ? '#30d158' : '#8e8e93' }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* Share button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex-none flex flex-col items-center pt-2 pb-1.5 px-3 transition-colors relative"
          >
            {TabIcons.delen(sync.isSharing)}
            <span
              className="text-[10px] font-medium mt-0.5"
              style={{ color: sync.isSharing ? '#30d158' : '#8e8e93' }}
            >
              Delen
            </span>
            {sync.isSharing && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
                style={{ background: '#30d158' }}
              />
            )}
          </button>
        </div>
      </nav>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal sync={sync} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
}

export default App;
