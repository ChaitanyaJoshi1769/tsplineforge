/**
 * User preferences management
 * Handles storage and retrieval of user settings
 */

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  editor: {
    autoSave: boolean;
    autoSaveInterval: number; // milliseconds
    showGrid: boolean;
    gridSize: number;
    showStats: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    shareUsageData: boolean;
  };
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'normal' | 'large';
    focusIndicator: boolean;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  language: 'en',
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
    email: false,
  },
  editor: {
    autoSave: true,
    autoSaveInterval: 30000,
    showGrid: true,
    gridSize: 1,
    showStats: true,
  },
  privacy: {
    shareAnalytics: true,
    shareUsageData: false,
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    fontSize: 'normal',
    focusIndicator: true,
  },
};

const STORAGE_KEY = 'user_preferences';

export class UserPreferencesManager {
  private preferences: UserPreferences;
  private listeners = new Set<(prefs: UserPreferences) => void>();

  constructor() {
    this.preferences = this.loadPreferences();
  }

  /**
   * Load preferences from storage
   */
  private loadPreferences(): UserPreferences {
    try {
      if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return { ...DEFAULT_PREFERENCES };

      const parsed = JSON.parse(stored) as Partial<UserPreferences>;
      return this.mergeWithDefaults(parsed);
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  /**
   * Merge user preferences with defaults
   */
  private mergeWithDefaults(partial: Partial<UserPreferences>): UserPreferences {
    return {
      theme: partial.theme ?? DEFAULT_PREFERENCES.theme,
      language: partial.language ?? DEFAULT_PREFERENCES.language,
      notifications: {
        ...DEFAULT_PREFERENCES.notifications,
        ...partial.notifications,
      },
      editor: {
        ...DEFAULT_PREFERENCES.editor,
        ...partial.editor,
      },
      privacy: {
        ...DEFAULT_PREFERENCES.privacy,
        ...partial.privacy,
      },
      accessibility: {
        ...DEFAULT_PREFERENCES.accessibility,
        ...partial.accessibility,
      },
    };
  }

  /**
   * Save preferences to storage
   */
  private savePreferences(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
      }
    } catch (error) {
      console.warn('Failed to save preferences:', error);
    }
  }

  /**
   * Get all preferences
   */
  getAll(): UserPreferences {
    return { ...this.preferences };
  }

  /**
   * Get specific preference value
   */
  get<K extends keyof UserPreferences>(key: K): UserPreferences[K] {
    return this.preferences[key];
  }

  /**
   * Set preference value
   */
  set<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    this.preferences[key] = value;
    this.savePreferences();
    this.notifyListeners();
  }

  /**
   * Update nested preference
   */
  updateNested<K extends keyof UserPreferences>(
    key: K,
    updates: Partial<UserPreferences[K]>,
  ): void {
    const current = this.preferences[key];
    if (typeof current === 'object' && current !== null) {
      this.preferences[key] = { ...current, ...updates } as UserPreferences[K];
      this.savePreferences();
      this.notifyListeners();
    }
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
    this.notifyListeners();
  }

  /**
   * Subscribe to preference changes
   */
  onChange(callback: (prefs: UserPreferences) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getAll()));
  }
}

// Global instance
let instance: UserPreferencesManager | null = null;

export function getUserPreferences(): UserPreferencesManager {
  if (!instance) {
    instance = new UserPreferencesManager();
  }
  return instance;
}

export const DEFAULT_USER_PREFERENCES = DEFAULT_PREFERENCES;
