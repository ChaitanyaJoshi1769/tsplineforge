'use client';

import { useState } from 'react';
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
  icon: React.ComponentType<{ size: number }>;
  shortcut?: string;
  onClick: () => void;
}

interface CADToolbarProps {
  tools?: Tool[];
  onToolSelect?: (toolId: string) => void;
}

export function CADToolbar({ tools = [], onToolSelect }: CADToolbarProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const defaultTools: Tool[] = [
    {
      id: 'select',
      label: 'Select',
      icon: Maximize2,
      shortcut: 'S',
      onClick: () => {},
    },
    {
      id: 'move',
      label: 'Move',
      icon: Move3D,
      shortcut: 'M',
      onClick: () => {},
    },
    {
      id: 'extrude',
      label: 'Extrude',
      icon: Zap,
      shortcut: 'E',
      onClick: () => {},
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: Copy,
      shortcut: 'D',
      onClick: () => {},
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      shortcut: 'Del',
      onClick: () => {},
    },
  ];

  const allTools = tools.length > 0 ? tools : defaultTools;

  const handleToolClick = (toolId: string, tool: Tool) => {
    setSelectedTool(toolId);
    tool.onClick();
    onToolSelect?.(toolId);
  };

  return (
    <div className="flex flex-col gap-2 bg-card rounded-lg border border-border p-3">
      {/* Transform Tools */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase px-2">
          Transform
        </div>
        <div className="flex flex-col gap-2">
          {allTools.slice(0, 3).map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id, tool)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTool === tool.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-background/80 text-foreground'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <tool.icon size={16} />
              <span>{tool.label}</span>
              {tool.shortcut && (
                <span className="ml-auto text-xs text-muted-foreground">{tool.shortcut}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Edit Tools */}
      <div className="border-t border-border pt-2 mt-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">
          Edit
        </div>
        <div className="flex flex-col gap-2">
          {allTools.slice(3, 5).map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id, tool)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTool === tool.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-background/80 text-foreground'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <tool.icon size={16} />
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File Tools */}
      <div className="border-t border-border pt-2 mt-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">
          File
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-1 px-2 py-2 rounded-md bg-background hover:bg-background/80 text-foreground text-sm font-medium transition-colors" title="Export">
            <Download size={14} />
          </button>
          <button className="flex items-center justify-center gap-1 px-2 py-2 rounded-md bg-background hover:bg-background/80 text-foreground text-sm font-medium transition-colors" title="Import">
            <Upload size={14} />
          </button>
        </div>
      </div>

      {/* History Tools */}
      <div className="border-t border-border pt-2 mt-2">
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-1 px-2 py-2 rounded-md bg-background hover:bg-background/80 text-foreground text-sm font-medium transition-colors" title="Undo">
            <Undo2 size={14} />
          </button>
          <button className="flex items-center justify-center gap-1 px-2 py-2 rounded-md bg-background hover:bg-background/80 text-foreground text-sm font-medium transition-colors" title="Redo">
            <Redo2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
