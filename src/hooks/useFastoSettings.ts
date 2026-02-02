import { useState, useEffect, useCallback } from 'react';

export interface FastoSettings {
  enabled: boolean;
  autoConnect: boolean;
  voiceId: string | null;
}

const STORAGE_KEY = 'fasto-settings';

const DEFAULT_SETTINGS: FastoSettings = {
  enabled: true,
  autoConnect: true,
  voiceId: null
};

function loadSettings(): FastoSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('[useFastoSettings] Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: FastoSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[useFastoSettings] Failed to save settings:', e);
  }
}

export function useFastoSettings() {
  const [settings, setSettings] = useState<FastoSettings>(loadSettings);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(e.newValue) });
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSettings = useCallback((updates: Partial<FastoSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      // Dispatch event for other components to react
      window.dispatchEvent(new CustomEvent('fasto-settings-change', { detail: next }));
      return next;
    });
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    updateSettings({ enabled });
  }, [updateSettings]);

  const setAutoConnect = useCallback((autoConnect: boolean) => {
    updateSettings({ autoConnect });
  }, [updateSettings]);

  const setVoiceId = useCallback((voiceId: string | null) => {
    updateSettings({ voiceId });
  }, [updateSettings]);

  return {
    settings,
    setEnabled,
    setAutoConnect,
    setVoiceId,
    updateSettings
  };
}
