/**
 * Settings Hook
 */

import { useState, useEffect } from 'react';
import { getUserSettings, updateUserSettings } from '../api/settingsApi';

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getUserSettings();
        if (!mounted) return;
        setSettings(res);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load settings.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetch();

    return () => {
      mounted = false;
    };
  }, []);

  const updateSettings = async (newSettings) => {
    try {
      const updated = await updateUserSettings(newSettings);
      setSettings(updated);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  return { settings, loading, error, updateSettings };
}
