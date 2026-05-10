# Feature #21: Developer Quick Start Guide

## Quick Overview

The Advanced Export System provides a premium UI for exporting 3D models in multiple CAD formats. It includes:
- Real-time mesh analysis
- Format-specific configuration
- Export history with persistence
- Full TypeScript type safety

## Using the Export System

### Basic Usage

The export button is already integrated in the editor:

```typescript
import { ExportButton } from '@/components/editor/ExportButton';

export function Editor() {
  const sceneRef = useRef<THREE.Scene>(null);
  
  return (
    <>
      {/* ... editor content ... */}
      <ExportButton 
        scene={sceneRef.current} 
        projectName="my-model"
      />
    </>
  );
}
```

### What Happens When User Exports

1. **User opens export dialog** → `AdvancedExportDialog` mounts
2. **Mesh stats calculated** → `useMeshStatistics` hook analyzes geometry
3. **User selects format** → `useExportOptions` updates format-specific options
4. **User clicks Export** → `onExport` callback triggered with validated options
5. **Export completes** → Entry added to history via `useExportHistory`

## Key APIs

### Hooks

#### `useMeshStatistics(scene)`
Calculate real-time mesh geometry stats.

```typescript
const { statistics, isLoading, error, refresh } = useMeshStatistics(scene);

// statistics contains:
// {
//   vertexCount: number,
//   faceCount: number,
//   bounds: { x, y, z },
//   surfaceArea: number,
//   volume?: number,
//   isManifold: boolean,
//   hasMaterials: boolean,
//   hasAnimations: boolean,
//   materialCount: number
// }
```

#### `useExportOptions(initialFormat?, initialFilename?)`
Manage export options for current format.

```typescript
const { 
  options,      // Current export options
  validation,   // Validation errors/warnings
  setFormat,    // Change format
  setFilename,  // Change filename
  updateOption, // Update specific option
  reset,        // Reset to defaults
  getFormattedFilename // Get full filename with extension
} = useExportOptions('stl', 'model');

// Update a specific option
updateOption('unit', 'mm');  // Type-safe per format!
```

#### `useExportHistory()`
Manage export history.

```typescript
const {
  history,      // Array of ExportHistoryEntry[]
  isLoading,
  addEntry,     // Add new entry
  removeEntry,  // Remove by ID
  clearHistory, // Clear all
  getRecent,    // Get last N entries
  search,       // Search by filename
  getByFormat   // Filter by format
} = useExportHistory();

// Add an export to history
const entry = addEntry(
  'model.stl',
  'stl',
  { format: 'stl', ... },
  fileSize,
  errorMessage // optional
);
```

### Utilities

#### `calculateMeshStatistics(scene)`
Direct mesh analysis (called by hook).

```typescript
import { calculateMeshStatistics } from '@/lib/meshStatistics';

const stats = calculateMeshStatistics(scene);
console.log(`Model has ${stats.vertexCount} vertices`);
```

#### `validateGeometry(scene)`
Check format compatibility.

```typescript
import { validateGeometry } from '@/lib/cadValidation';

const validation = validateGeometry(scene);
if (!validation.valid) {
  console.warn(validation.errors);
  console.warn(validation.warnings);
}
```

#### `ExportHistoryManager`
Low-level history operations.

```typescript
import { ExportHistoryManager } from '@/lib/exportHistory';

// Add entry
const entry = ExportHistoryManager.addEntry(filename, format, options);

// Get all history
const all = ExportHistoryManager.getHistory();

// Search
const results = ExportHistoryManager.searchByFilename('model');

// Remove
ExportHistoryManager.removeEntry(entryId);
```

## Types Reference

### ExportFormat
```typescript
type ExportFormat = 'step' | 'iges' | 'stl' | 'gltf' | 'obj';
```

### ExportOptions (Discriminated Union)
```typescript
// Use discriminated union to get format-specific types:
type ExportOptions = 
  | STEPExportOptions 
  | IGESExportOptions 
  | STLExportOptions 
  | GLTFExportOptions 
  | OBJExportOptions;

// Example: STEP-specific options
interface STEPExportOptions extends BaseExportOptions {
  format: 'step';
  filename: string;
  unit: UnitSystem;
  tolerance: number;
  stepVariant: 'AP203' | 'AP214';
  preserveColors: boolean;
  preserveMaterials: boolean;
}

// Example: STL-specific options
interface STLExportOptions extends BaseExportOptions {
  format: 'stl';
  filename: string;
  unit: UnitSystem;
  stlFormat: 'binary' | 'ascii';
  precision: 'high' | 'medium' | 'low';
  optimization?: 'none' | 'merge' | 'decimate';
}
```

### MeshStatistics
```typescript
interface MeshStatistics {
  vertexCount: number;
  faceCount: number;
  bounds: { x: number; y: number; z: number };
  surfaceArea: number;
  volume?: number;        // undefined if non-manifold
  isManifold: boolean;
  hasMaterials: boolean;
  hasAnimations: boolean;
  materialCount: number;
}
```

### ExportHistoryEntry
```typescript
interface ExportHistoryEntry {
  id: string;
  filename: string;
  format: ExportFormat;
  fileSize?: number;
  timestamp: number;      // milliseconds since epoch
  options: ExportOptions;
  success: boolean;
  errorMessage?: string;
}
```

## Format-Specific Implementation

### Adding STEP Export Backend

1. **Install library** (if needed):
```bash
npm install @xeokit/xkt-converter  # or equivalent STEP library
```

2. **Implement export function** in `lib/exporters.ts`:
```typescript
export async function exportToSTEP(
  scene: THREE.Object3D,
  filename: string,
  options: STEPExportOptions,
): Promise<ExportResult> {
  try {
    // 1. Validate geometry
    const validation = validateGeometry(scene);
    if (!validation.valid) {
      throw new Error(validation.errors[0]);
    }

    // 2. Convert scene to appropriate format
    const stepData = convertSceneToSTEP(scene, {
      unit: options.unit,
      tolerance: options.tolerance,
      variant: options.stepVariant,
      preserveColors: options.preserveColors,
    });

    // 3. Return result
    return {
      success: true,
      data: stepData,
      filename: `${options.filename}.step`,
      mimeType: 'application/octet-stream',
    };
  } catch (error) {
    return {
      success: false,
      filename,
      mimeType: 'application/octet-stream',
      error: `STEP export failed: ${error.message}`,
    };
  }
}
```

3. **Update ExportButton** to handle new format:
```typescript
const legacyOptions: LegacyExportOptions = {
  // Map new formats to existing ones during fallback
  format: (
    format === 'step' ? 'stl' :
    format === 'iges' ? 'stl' :
    format
  ),
  binary: true,
};
```

4. **Test the export**:
```typescript
const result = await exportToSTEP(scene, 'test', {
  format: 'step',
  filename: 'test',
  unit: 'mm',
  tolerance: 0.01,
  stepVariant: 'AP203',
  preserveColors: true,
  preserveMaterials: true,
});
```

## Common Patterns

### Format-Specific Logic
```typescript
// Use discriminated union type narrowing
const handleFormatChange = (format: ExportFormat) => {
  if (format === 'step') {
    // Do STEP-specific setup
  } else if (format === 'stl') {
    // Do STL-specific setup
  }
  // ...
};

// Or use type guard
const isSTEP = (opts: ExportOptions): opts is STEPExportOptions => {
  return opts.format === 'step';
};
```

### Safe Type Casting
```typescript
// When accessing format-specific properties
const tolerance = (options as unknown as Record<string, unknown>).tolerance;

// Or use type guard
if (isSTEP(options)) {
  console.log(options.stepVariant); // Type-safe!
}
```

### Handling Large Models
```typescript
const stats = useMeshStatistics(scene);

if (!stats) {
  return <div>Loading geometry info...</div>;
}

if (stats.vertexCount > 10_000_000) {
  console.warn('Very large model, export may be slow');
}
```

## Debugging

### Check Mesh Stats
```typescript
const { statistics } = useMeshStatistics(scene);
console.log('Mesh Stats:', {
  vertices: statistics?.vertexCount,
  faces: statistics?.faceCount,
  manifold: statistics?.isManifold,
  volume: statistics?.volume,
});
```

### Check Validation
```typescript
const { validation } = useExportOptions();
if (!validation.valid) {
  console.error('Export validation failed:', validation.errors);
  console.warn('Warnings:', validation.warnings);
}
```

### Check History
```typescript
const { history } = useExportHistory();
console.log('Export History:', history.map(e => ({
  file: e.filename,
  format: e.format,
  timestamp: new Date(e.timestamp),
  success: e.success,
})));
```

## Performance Tips

1. **Mesh statistics calculation is O(n)** - Don't recalculate unnecessarily
2. **History is limited to 50 items** - Old entries are automatically removed
3. **localStorage has ~5-10MB quota** - Monitor file sizes in history
4. **Animations are GPU-accelerated** - Use `will-change` sparingly

## Accessibility Notes

- Dialog has focus trap (Tab loops within dialog)
- Close button has proper ARIA labels
- Format cards are keyboard-selectable
- All inputs have associated labels
- Error messages are role="alert"
- Status updates use aria-live="polite"

## Testing

### Unit Test Example
```typescript
import { calculateMeshStatistics } from '@/lib/meshStatistics';

describe('calculateMeshStatistics', () => {
  it('should count vertices correctly', () => {
    const scene = createTestScene();
    const stats = calculateMeshStatistics(scene);
    expect(stats.vertexCount).toBe(expectedCount);
  });
});
```

### Integration Test Example
```typescript
import { renderHook, act } from '@testing-library/react';
import { useExportOptions } from '@/hooks/useExportOptions';

describe('useExportOptions', () => {
  it('should validate options on change', () => {
    const { result } = renderHook(() => useExportOptions('stl'));
    
    act(() => {
      result.current.setFormat('step');
    });
    
    expect(result.current.validation.valid).toBe(true);
  });
});
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module '893.js'" | Clean `.next/` and rebuild: `rm -rf .next && npm run build` |
| Type errors on format options | Use discriminated union type guards or `as unknown as Format` |
| localStorage quota exceeded | Clear old history entries or implement cleanup |
| Mesh stats show as loading | Ensure scene is properly passed and has geometry |
| Export doesn't download | Check browser download permissions and CORS |

## Resources

- **Type Definitions**: `/src/lib/exportOptions.ts`
- **Components**: `/src/components/editor/Advanced*.tsx`
- **Hooks**: `/src/hooks/useExport*.ts`
- **Utilities**: `/src/lib/meshStatistics.ts`, `cadValidation.ts`

---

**Quick Links**:
- [Feature #21 Summary](./FEATURE_21_SUMMARY.md)
- [Implementation Checklist](./FEATURE_21_IMPLEMENTATION_CHECKLIST.md)
- [GitHub Repository](https://github.com/ChaitanyaJoshi1769/tsplineforge)

**Questions?** Check the source code comments - they're comprehensive!
