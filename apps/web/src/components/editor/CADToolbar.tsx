'use client';

import { useState } from 'react';
import { useEditorStore } from '@/hooks/useEditorStore';
import { useMeshOperations } from '@/hooks/useMeshOperations';
import { Tooltip } from '@/components/ui/Tooltip';
import { Separator } from '@/components/ui/Separator';
import {
  Maximize2,
  Move3D,
  Zap,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  Download,
  Upload,
} from 'lucide-react';

interface Tool {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: string | number }>;
  shortcut?: string;
  onClick: () => void;
}

interface CADToolbarProps {
  tools?: Tool[];
  onToolSelect?: (toolId: string) => void;
}

export function CADToolbar({ tools = [], onToolSelect }: CADToolbarProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const store = useEditorStore();
  const meshOps = useMeshOperations();

  const defaultTools: Tool[] = [
    {
      id: 'select',
      label: 'Select',
      icon: Maximize2,
      shortcut: 'Click',
      onClick: () => {
        store.setTransformMode(null);
      },
    },
    {
      id: 'move',
      label: 'Move',
      icon: Move3D,
      shortcut: 'G',
      onClick: () => {
        if (store.selectedMeshId) {
          store.setTransformMode(store.transformMode === 'move' ? null : 'move');
        }
      },
    },
    {
      id: 'extrude',
      label: 'Rotate',
      icon: Zap,
      shortcut: 'R',
      onClick: () => {
        if (store.selectedMeshId) {
          store.setTransformMode(store.transformMode === 'rotate' ? null : 'rotate');
        }
      },
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: Copy,
      shortcut: 'Shift+D',
      onClick: () => {
        if (store.selectedMeshId) {
          store.pushToHistory();
          meshOps.duplicate();
        }
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      shortcut: 'Del',
      onClick: () => {
        if (store.selectedMeshId) {
          store.pushToHistory();
          meshOps.deleteMesh();
        }
      },
    },
  ];

  const allTools = tools.length > 0 ? tools : defaultTools;

  const handleToolClick = (toolId: string, tool: Tool) => {
    setSelectedTool(toolId);
    tool.onClick();
    onToolSelect?.(toolId);
  };

  const ToolButton = ({ tool }: { tool: Tool }) => (
    <Tooltip content={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}>
      <button
        onClick={() => handleToolClick(tool.id, tool)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
          selectedTool === tool.id
            ? 'bg-primary/15 text-primary border border-primary/30'
            : 'text-foreground hover:bg-card-hover border border-transparent'
        }`}
        title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
      >
        <div className="flex-shrink-0">
          <tool.icon size={18} />
        </div>
        <span className="text-sm font-medium flex-1">{tool.label}</span>
        {tool.shortcut && (
          <span className="text-xs text-muted group-hover:text-foreground/60 transition-colors">
            {tool.shortcut}
          </span>
        )}
      </button>
    </Tooltip>
  );

  return (
    <div className="flex flex-col gap-1 space-y-0.5">
      {/* Transform Tools */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider px-2 py-1">
          Transform
        </div>
        <div className="flex flex-col gap-1">
          {allTools.slice(0, 3).map((tool) => (
            <ToolButton key={tool.id} tool={tool} />
          ))}
        </div>
      </div>

      <Separator />

      {/* Edit Tools */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider px-2 py-1">
          Edit
        </div>
        <div className="flex flex-col gap-1">
          {allTools.slice(3, 5).map((tool) => (
            <ToolButton key={tool.id} tool={tool} />
          ))}
        </div>
      </div>

      <Separator />

      {/* File Tools */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider px-2 py-1">
          File
        </div>
        <div className="grid grid-cols-2 gap-1">
          <Tooltip content="Export">
            <button className="flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg bg-card-hover hover:bg-card border border-border text-foreground transition-colors" title="Export">
              <Download size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Import">
            <button className="flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg bg-card-hover hover:bg-card border border-border text-foreground transition-colors" title="Import">
              <Upload size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      <Separator />

      {/* History Tools */}
      <div className="grid grid-cols-2 gap-1">
        <Tooltip content="Undo (Ctrl+Z)">
          <button
            onClick={() => meshOps.undo()}
            disabled={!meshOps.canUndo}
            className="flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg bg-card-hover hover:bg-card border border-border text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
        </Tooltip>
        <Tooltip content="Redo (Ctrl+Shift+Z)">
          <button
            onClick={() => meshOps.redo()}
            disabled={!meshOps.canRedo}
            className="flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg bg-card-hover hover:bg-card border border-border text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
