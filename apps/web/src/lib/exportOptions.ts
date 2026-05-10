/**
 * Export Options Type System & Validators
 * Defines format-specific options for CAD exports
 */

export type ExportFormat = 'step' | 'iges' | 'stl' | 'gltf' | 'obj';
export type UnitSystem = 'mm' | 'cm' | 'in' | 'm';
export type STLFormat = 'binary' | 'ascii';
export type STLOptimization = 'none' | 'merge' | 'decimate';
export type Precision = 'auto' | 'high' | 'medium' | 'low';

export interface FormatCapabilities {
  colors: boolean;
  materials: boolean;
  assembly: boolean;
  parametric: boolean;
}

export interface FormatInfo {
  id: ExportFormat;
  name: string;
  extensions: string[];
  description: string;
  mimeType: string;
  capabilities: FormatCapabilities;
  variants?: 'binary' | 'ascii' | 'both';
}

export const FORMAT_INFO: Record<ExportFormat, FormatInfo> = {
  step: {
    id: 'step',
    name: 'STEP',
    extensions: ['.step', '.stp'],
    description: 'ISO CAD standard - preserves colors and materials',
    mimeType: 'application/step',
    capabilities: {
      colors: true,
      materials: true,
      assembly: true,
      parametric: true,
    },
    variants: 'both',
  },
  iges: {
    id: 'iges',
    name: 'IGES',
    extensions: ['.iges', '.igs'],
    description: 'CAD interchange format - wide compatibility',
    mimeType: 'application/iges',
    capabilities: {
      colors: true,
      materials: false,
      assembly: true,
      parametric: false,
    },
  },
  stl: {
    id: 'stl',
    name: 'STL',
    extensions: ['.stl'],
    description: 'Stereolithography - ideal for 3D printing',
    mimeType: 'model/stl',
    capabilities: {
      colors: false,
      materials: false,
      assembly: false,
      parametric: false,
    },
    variants: 'both',
  },
  gltf: {
    id: 'gltf',
    name: 'glTF',
    extensions: ['.gltf', '.glb'],
    description: 'Modern 3D format - web-ready with materials',
    mimeType: 'model/gltf+json',
    capabilities: {
      colors: true,
      materials: true,
      assembly: false,
      parametric: false,
    },
  },
  obj: {
    id: 'obj',
    name: 'OBJ',
    extensions: ['.obj'],
    description: 'Wavefront format - universal compatibility',
    mimeType: 'model/obj',
    capabilities: {
      colors: false,
      materials: true,
      assembly: false,
      parametric: false,
    },
  },
};

/**
 * Base export options
 */
export interface BaseExportOptions {
  format: ExportFormat;
  filename: string;
  unit: UnitSystem;
}

/**
 * STEP-specific options
 */
export interface STEPExportOptions extends BaseExportOptions {
  format: 'step';
  stepVariant: 'AP203' | 'AP214';
  tolerance: number; // in current units
  preserveColors: boolean;
  preserveMaterials: boolean;
}

/**
 * IGES-specific options
 */
export interface IGESExportOptions extends BaseExportOptions {
  format: 'iges';
  igesVersion: '5.1' | '5.3';
  tolerance: number;
  preserveColors: boolean;
}

/**
 * STL-specific options
 */
export interface STLExportOptions extends BaseExportOptions {
  format: 'stl';
  stlFormat: STLFormat;
  optimization: STLOptimization;
  precision: Precision;
}

/**
 * glTF-specific options
 */
export interface GLTFExportOptions extends BaseExportOptions {
  format: 'gltf';
  compressed: boolean;
  includeAnimations: boolean;
  includeMetadata: boolean;
}

/**
 * OBJ-specific options
 */
export interface OBJExportOptions extends BaseExportOptions {
  format: 'obj';
  includeMaterials: boolean;
  precision: Precision;
}

export type ExportOptions =
  | STEPExportOptions
  | IGESExportOptions
  | STLExportOptions
  | GLTFExportOptions
  | OBJExportOptions;

/**
 * Get default options for a format
 */
export function getDefaultExportOptions(format: ExportFormat, filename: string = 'model'): ExportOptions {
  const baseOptions = {
    filename: filename.replace(/\.[^.]+$/, ''),
    unit: 'mm' as UnitSystem,
  };

  switch (format) {
    case 'step':
      return {
        ...baseOptions,
        format: 'step',
        stepVariant: 'AP203',
        tolerance: 0.01,
        preserveColors: true,
        preserveMaterials: true,
      } as STEPExportOptions;

    case 'iges':
      return {
        ...baseOptions,
        format: 'iges',
        igesVersion: '5.3',
        tolerance: 0.01,
        preserveColors: true,
      } as IGESExportOptions;

    case 'stl':
      return {
        ...baseOptions,
        format: 'stl',
        stlFormat: 'binary',
        optimization: 'none',
        precision: 'auto',
      } as STLExportOptions;

    case 'gltf':
      return {
        ...baseOptions,
        format: 'gltf',
        compressed: false,
        includeAnimations: true,
        includeMetadata: true,
      } as GLTFExportOptions;

    case 'obj':
      return {
        ...baseOptions,
        format: 'obj',
        includeMaterials: true,
        precision: 'auto',
      } as OBJExportOptions;

    default:
      return {
        ...baseOptions,
        format: 'stl',
        stlFormat: 'binary',
        optimization: 'none',
        precision: 'auto',
      } as STLExportOptions;
  }
}

/**
 * Validate export options
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateExportOptions(options: ExportOptions): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate filename
  if (!options.filename || options.filename.trim() === '') {
    errors.push('Filename is required');
  } else if (!/^[a-zA-Z0-9_\-\.]+$/.test(options.filename)) {
    errors.push('Filename contains invalid characters');
  }

  // Validate unit
  const validUnits: UnitSystem[] = ['mm', 'cm', 'in', 'm'];
  if (!validUnits.includes(options.unit)) {
    errors.push('Invalid unit system');
  }

  // Format-specific validation
  switch (options.format) {
    case 'step': {
      const stepOptions = options as STEPExportOptions;
      if (stepOptions.tolerance <= 0) {
        errors.push('Tolerance must be positive');
      }
      if (stepOptions.tolerance < 0.001) {
        warnings.push('Very tight tolerance may slow down export');
      }
      break;
    }

    case 'stl': {
      const stlOptions = options as STLExportOptions;
      if (!['binary', 'ascii'].includes(stlOptions.stlFormat)) {
        errors.push('Invalid STL format');
      }
      break;
    }

    default:
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get file extension for format
 */
export function getFileExtension(format: ExportFormat): string {
  return FORMAT_INFO[format].extensions[0];
}

/**
 * Get full filename with extension
 */
export function getFullFilename(options: ExportOptions): string {
  const extension = getFileExtension(options.format);
  return `${options.filename}${extension}`;
}

/**
 * Convert units
 */
export function convertUnits(value: number, fromUnit: UnitSystem, toUnit: UnitSystem): number {
  const mmConversion: Record<UnitSystem, number> = {
    mm: 1,
    cm: 10,
    in: 25.4,
    m: 1000,
  };

  const fromMM = value * mmConversion[fromUnit];
  const toMM = mmConversion[toUnit];

  return fromMM / toMM;
}

/**
 * Get precision value for geometry decimation
 */
export function getPrecisionValue(precision: Precision, bounds: { x: number; y: number; z: number }): number {
  const maxDim = Math.max(bounds.x, bounds.y, bounds.z);

  switch (precision) {
    case 'high':
      return maxDim * 0.001; // 0.1% of largest dimension
    case 'medium':
      return maxDim * 0.005; // 0.5% of largest dimension
    case 'low':
      return maxDim * 0.01; // 1% of largest dimension
    case 'auto':
    default:
      return maxDim * 0.002; // 0.2% of largest dimension
  }
}
