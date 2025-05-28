
"use client";

import { useState, useEffect, useCallback } from 'react';

const USER_SETTINGS_KEY = 'nightPlannerUserSettings';

export interface UserSettings {
  defaultTaskTime: string; // HH:mm format, e.g., "09:00"
  enableEmailAlerts: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  defaultTaskTime: '09:00', // Default to 9 AM
  enableEmailAlerts: false, // Default to disabled
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true); // Renamed for clarity

  useEffect(() => {
    // Ensure localStorage is accessed only on the client side
    if (typeof window !== 'undefined') {
      try {
        const storedSettings = localStorage.getItem(USER_SETTINGS_KEY);
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          // Ensure all keys from DEFAULT_SETTINGS are present, even if new ones are added
          setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
        } else {
          // If no settings stored, save the default ones
          localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
          setSettings(DEFAULT_SETTINGS); // Also set state to default
        }
      } catch (error) {
        console.error("Failed to load user settings from localStorage:", error);
        // Fallback to default settings if an error occurs
        setSettings(DEFAULT_SETTINGS);
      }
      setIsLoadingSettings(false);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(updatedSettings));
        } catch (error) {
          console.error("Failed to save user settings to localStorage:", error);
        }
      }
      return updatedSettings;
    });
  }, []);

  return {
    settings,
    isLoadingSettings,
    updateSettings,
  };
}

