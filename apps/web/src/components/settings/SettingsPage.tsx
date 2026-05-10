'use client';

import React from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/context/toast';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

export function SettingsPage() {
  const { preferences, updatePreference, updateNestedPreference, resetPreferences } =
    useUserPreferences();
  const { addToast } = useToast();

  if (!preferences) {
    return <div className="p-6">Loading preferences...</div>;
  }

  const handleReset = () => {
    resetPreferences();
    addToast({
      type: 'success',
      title: 'Settings Reset',
      message: 'All settings have been reset to defaults',
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted">Customize your TSplineForge experience</p>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <Tabs defaultValue="general">
            <TabsList className="bg-subtle/30">
              <TabsTrigger value="general">⚙️ General</TabsTrigger>
              <TabsTrigger value="editor">✏️ Editor</TabsTrigger>
              <TabsTrigger value="notifications">🔔 Notifications</TabsTrigger>
              <TabsTrigger value="privacy">🔒 Privacy</TabsTrigger>
              <TabsTrigger value="accessibility">♿ Accessibility</TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="p-6 space-y-6">
              <SettingGroup title="Theme" description="Choose your preferred color theme">
                <div className="flex gap-4">
                  {(['light', 'dark', 'system'] as const).map((theme) => (
                    <label key={theme} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value={theme}
                        checked={preferences.theme === theme}
                        onChange={(e) =>
                          updatePreference('theme', e.target.value as typeof theme)
                        }
                        className="w-4 h-4"
                      />
                      <span className="capitalize text-sm">{theme}</span>
                    </label>
                  ))}
                </div>
              </SettingGroup>

              <SettingGroup title="Language" description="Select your preferred language">
                <select
                  value={preferences.language}
                  onChange={(e) => updatePreference('language', e.target.value)}
                  className="px-3 py-2 bg-subtle border border-border rounded-lg text-sm text-foreground"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                </select>
              </SettingGroup>
            </TabsContent>

            {/* Editor Settings */}
            <TabsContent value="editor" className="p-6 space-y-6">
              <SettingGroup title="Auto-Save" description="Automatically save your work">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.editor.autoSave}
                    onChange={(e) =>
                      updateNestedPreference('editor', { autoSave: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Enable auto-save</span>
                </label>
              </SettingGroup>

              <SettingGroup title="Grid" description="Configure viewport grid">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.editor.showGrid}
                    onChange={(e) =>
                      updateNestedPreference('editor', { showGrid: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Show grid</span>
                </label>
              </SettingGroup>

              <SettingGroup title="Statistics" description="Display viewport statistics">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.editor.showStats}
                    onChange={(e) =>
                      updateNestedPreference('editor', { showStats: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Show FPS and stats</span>
                </label>
              </SettingGroup>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="p-6 space-y-6">
              <SettingGroup
                title="Notifications"
                description="Manage notification preferences"
              >
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.notifications.enabled}
                      onChange={(e) =>
                        updateNestedPreference('notifications', {
                          enabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Enable notifications</span>
                  </label>

                  {preferences.notifications.enabled && (
                    <>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notifications.sound}
                          onChange={(e) =>
                            updateNestedPreference('notifications', {
                              sound: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Sound</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notifications.desktop}
                          onChange={(e) =>
                            updateNestedPreference('notifications', {
                              desktop: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Desktop notifications</span>
                      </label>
                    </>
                  )}
                </div>
              </SettingGroup>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="p-6 space-y-6">
              <SettingGroup title="Analytics" description="Help improve the app">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.privacy.shareAnalytics}
                    onChange={(e) =>
                      updateNestedPreference('privacy', { shareAnalytics: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Share usage analytics</span>
                </label>
              </SettingGroup>
            </TabsContent>

            {/* Accessibility Settings */}
            <TabsContent value="accessibility" className="p-6 space-y-6">
              <SettingGroup title="Motion" description="Reduce animations">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.accessibility.reduceMotion}
                    onChange={(e) =>
                      updateNestedPreference('accessibility', {
                        reduceMotion: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Reduce motion</span>
                </label>
              </SettingGroup>

              <SettingGroup title="Contrast" description="High contrast colors">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.accessibility.highContrast}
                    onChange={(e) =>
                      updateNestedPreference('accessibility', {
                        highContrast: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">High contrast mode</span>
                </label>
              </SettingGroup>
            </TabsContent>
          </Tabs>

          <div className="border-t border-border px-6 py-4 flex gap-3 justify-end">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingGroupProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SettingGroup({ title, description, children }: SettingGroupProps) {
  return (
    <div>
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      {description && <p className="text-xs text-muted mb-3">{description}</p>}
      <div className="space-y-2">{children}</div>
    </div>
  );
}
