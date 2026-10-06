import { useEffect, useState } from 'react';

// Broadcast channel or local event for simulated offline state
const OFFLINE_SIM_KEY = 'dotx_simulated_offline';

export function useOnlineStatus() {
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(() => {
    return localStorage.getItem(OFFLINE_SIM_KEY) === 'true';
  });

  const [realOnline, setRealOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setRealOnline(true);
    const handleOffline = () => setRealOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === OFFLINE_SIM_KEY) {
        setIsSimulatedOffline(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const toggleSimulatedOffline = (forceState?: boolean) => {
    const nextState = forceState !== undefined ? forceState : !isSimulatedOffline;
    setIsSimulatedOffline(nextState);
    if (nextState) {
      localStorage.setItem(OFFLINE_SIM_KEY, 'true');
    } else {
      localStorage.removeItem(OFFLINE_SIM_KEY);
    }
  };

  const isOnline = realOnline && !isSimulatedOffline;

  return {
    isOnline,
    realOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
  };
}
