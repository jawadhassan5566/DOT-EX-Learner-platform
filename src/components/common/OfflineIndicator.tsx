import React from 'react';
import { WifiOff, Database, BookOpen, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import { useApp } from '../../context/AppContext.js';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSimulatedOffline, toggleSimulatedOffline } = useOnlineStatus();
  const { navigateTo } = useApp();

  if (isOnline) return null;

  return (
    <aside aria-label="Offline Mode Notification" className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-auto z-50 max-w-md animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="bg-slate-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-md rounded-2xl p-3.5 text-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <WifiOff className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-amber-300">
                {isSimulatedOffline ? 'Offline Testing Mode' : 'Offline Mode Active'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                IndexedDB
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Accessing your downloaded books and study notes offline.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <button
            onClick={() => navigateTo('library')}
            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1 transition-colors"
            title="Open Offline Books & Notes"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline Shelf</span>
          </button>

          {isSimulatedOffline && (
            <button
              onClick={() => toggleSimulatedOffline(false)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Exit simulated offline mode"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
