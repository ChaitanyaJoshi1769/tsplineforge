import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/toast';
import { useCommands } from '@/hooks/useCommandPalette';
import type { Command } from '@/components/ui/CommandPalette';
import {
  Plus,
  FolderOpen,
  Save,
  Download,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';

export function useDefaultCommands(onSave?: () => void | Promise<void>) {
  const router = useRouter();
  const { addToast } = useToast();

  const handleNewProject = useCallback(async () => {
    addToast({
      type: 'info',
      title: 'New Project',
      message: 'Creating new project...',
    });
    router.push('/dashboard?new=true');
  }, [router, addToast]);

  const handleOpenProject = useCallback(async () => {
    router.push('/dashboard');
  }, [router]);

  const handleSave = useCallback(async () => {
    if (onSave) {
      await onSave();
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Project saved successfully',
      });
    }
  }, [onSave, addToast]);

  const handleExport = useCallback(async () => {
    addToast({
      type: 'info',
      title: 'Export',
      message: 'Export functionality coming soon',
    });
  }, [addToast]);

  const handleSettings = useCallback(async () => {
    router.push('/settings');
  }, [router]);

  const handleHelp = useCallback(async () => {
    window.open('/help', '_blank');
  }, []);

  const handleLogout = useCallback(async () => {
    addToast({
      type: 'info',
      title: 'Logout',
      message: 'Logging out...',
    });
    router.push('/logout');
  }, [router, addToast]);

  const commands: Command[] = [
    {
      id: 'new-project',
      label: 'New Project',
      description: 'Create a new project',
      category: 'File',
      shortcut: 'Ctrl+N',
      icon: React.createElement(Plus, { size: 16 }),
      action: handleNewProject,
    },
    {
      id: 'open-project',
      label: 'Open Project',
      description: 'Open an existing project',
      category: 'File',
      shortcut: 'Ctrl+O',
      icon: React.createElement(FolderOpen, { size: 16 }),
      action: handleOpenProject,
    },
    {
      id: 'save-project',
      label: 'Save Project',
      description: 'Save current project',
      category: 'File',
      shortcut: 'Ctrl+S',
      icon: React.createElement(Save, { size: 16 }),
      action: handleSave,
      visible: !!onSave,
    },
    {
      id: 'export-project',
      label: 'Export Project',
      description: 'Export as STL, GLTF, or other formats',
      category: 'File',
      shortcut: 'Ctrl+E',
      icon: React.createElement(Download, { size: 16 }),
      action: handleExport,
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Open application settings',
      category: 'Application',
      shortcut: 'Ctrl+,',
      icon: React.createElement(Settings, { size: 16 }),
      action: handleSettings,
    },
    {
      id: 'help',
      label: 'Help & Documentation',
      description: 'Open help documentation',
      category: 'Application',
      icon: React.createElement(HelpCircle, { size: 16 }),
      action: handleHelp,
    },
    {
      id: 'logout',
      label: 'Logout',
      description: 'Sign out of your account',
      category: 'Account',
      icon: React.createElement(LogOut, { size: 16 }),
      action: handleLogout,
    },
  ];

  useCommands(commands);
}
