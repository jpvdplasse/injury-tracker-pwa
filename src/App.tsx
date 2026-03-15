import { useState } from 'react';
import { useInjuries } from './hooks/useInjuries';
import { useSync } from './hooks/useSync';
import BodyMapPage from './pages/BodyMapPage';
import LogboekPage from './pages/LogboekPage';
import StatsPage from './pages/StatsPage';
import FollowingPage from './pages/FollowingPage';
import ShareModal from './components/ShareModal';

type Tab = 'bodymap' | 'logboek' | 'stats' | 'volgen';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('bodymap');
  const [showShareModal, setShowShareModal] = useState(false);
  const { injuries, addInjury, updateInjury, updateStatus, deleteInjury, mergeRemote } = useInjuries();
  const sync = useSync(injuries, mergeRemote);

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'bodymap', icon: '🏠', label: 'Body Map' },
    { key: 'logboek', icon: '📋', label: 'Logboek' },
    { key: 'stats', icon: '📊', label: 'Stats' },
    { key: 'volgen', icon: '👥', label: 'Volgen' },
  ];

  return (
    <div className="h-full flex flex-col bg-surface-900">
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

      {/* Bottom navigation */}
      <nav className="bg-white border-t border-surface-600 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center py-2.5 transition-colors ${
                activeTab === tab.key
                  ? 'text-rugby-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {activeTab === tab.key && (
                <div className="w-4 h-0.5 bg-rugby-700 rounded-full mt-0.5" />
              )}
            </button>
          ))}

          {/* Share button */}
          <button
            onClick={() => setShowShareModal(true)}
            className={`flex-none flex flex-col items-center py-2.5 px-3 transition-colors relative ${
              sync.isSharing ? 'text-rugby-700' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-xl mb-0.5">🔗</span>
            <span className="text-[10px] font-medium">Delen</span>
            {sync.isSharing && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500 border border-white" />
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
