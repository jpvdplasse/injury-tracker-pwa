import { useState } from 'react';
import { useInjuries } from './hooks/useInjuries';
import BodyMapPage from './pages/BodyMapPage';
import LogboekPage from './pages/LogboekPage';
import StatsPage from './pages/StatsPage';

type Tab = 'bodymap' | 'logboek' | 'stats';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('bodymap');
  const { injuries, addInjury, updateInjury, updateStatus, deleteInjury } = useInjuries();

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'bodymap', icon: '🏠', label: 'Body Map' },
    { key: 'logboek', icon: '📋', label: 'Logboek' },
    { key: 'stats', icon: '📊', label: 'Stats' },
  ];

  return (
    <div className="h-full flex flex-col bg-surface-900">
      {/* Page content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'bodymap' && (
          <BodyMapPage injuries={injuries} onAddInjury={addInjury} />
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
      </div>

      {/* Bottom navigation */}
      <nav className="bg-surface-800 border-t border-surface-600 pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center py-2.5 transition-colors ${
                activeTab === tab.key
                  ? 'text-rugby-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {activeTab === tab.key && (
                <div className="w-4 h-0.5 bg-rugby-400 rounded-full mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default App;
