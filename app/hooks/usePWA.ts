'use client';

import { useEffect, useState } from 'react';

interface PWAState {
  isInstalled: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

export function usePWA(): PWAState {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
    isIOS: false,
    isAndroid: false,
  });

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isInstalled = isStandalone || (window.navigator as any).standalone === true;

    setState({
      isInstalled,
      isStandalone,
      canInstall: !isInstalled && (isIOS || isAndroid),
      isIOS,
      isAndroid,
    });
  }, []);

  return state;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useBeforeInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    return outcome === 'accepted';
  };

  return { canInstall: !!deferredPrompt, promptInstall };
}
