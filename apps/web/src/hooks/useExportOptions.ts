/**
 * Hook for managing export options state
 */

import { useState, useCallback } from 'react';
import {
  ExportFormat,
  ExportOptions,
  UnitSystem,
  STEPExportOptions,
  IGESExportOptions,
  STLExportOptions,
  GLTFExportOptions,
  OBJExportOptions,
  getDefaultExportOptions,
  validateExportOptions,
  ValidationResult,
} from '@/lib/exportOptions';

export interface UseExportOptionsReturn {
  options: ExportOptions;
  validation: ValidationResult;
  setFormat: (format: ExportFormat) => void;
  setFilename: (filename: string) => void;
  setUnit: (unit: UnitSystem) => void;
  updateOption: <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => void;
  reset: (newFormat?: ExportFormat) => void;
  getFormattedFilename: () => string;
}

/**
 * Hook to manage export options
 */
export function useExportOptions(initialFormat: ExportFormat = 'stl', initialFilename: string = 'model'): UseExportOptionsReturn {
  const [options, setOptions] = useState<ExportOptions>(() =>
    getDefaultExportOptions(initialFormat, initialFilename)
  );

  const [validation, setValidation] = useState<ValidationResult>(() => validateExportOptions(options));

  const updateValidation = useCallback((newOptions: ExportOptions) => {
    setValidation(validateExportOptions(newOptions));
  }, []);

  const setFormat = useCallback(
    (format: ExportFormat) => {
      const newOptions = getDefaultExportOptions(format, options.filename);
      setOptions(newOptions);
      updateValidation(newOptions);
    },
    [options.filename, updateValidation]
  );

  const setFilename = useCallback(
    (filename: string) => {
      const newOptions = {
        ...options,
        filename: filename.replace(/\.[^.]+$/, ''), // Remove extension if present
      };
      setOptions(newOptions);
      updateValidation(newOptions);
    },
    [options, updateValidation]
  );

  const setUnit = useCallback(
    (unit: UnitSystem) => {
      const newOptions = {
        ...options,
        unit,
      };
      setOptions(newOptions);
      updateValidation(newOptions);
    },
    [options, updateValidation]
  );

  const updateOption = useCallback(
    <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
      const newOptions = {
        ...options,
        [key]: value,
      };
      setOptions(newOptions);
      updateValidation(newOptions);
    },
    [options, updateValidation]
  );

  const reset = useCallback(
    (newFormat?: ExportFormat) => {
      const format = newFormat || options.format;
      const newOptions = getDefaultExportOptions(format, options.filename);
      setOptions(newOptions);
      updateValidation(newOptions);
    },
    [options.format, options.filename, updateValidation]
  );

  const getFormattedFilename = useCallback((): string => {
    const ext = options.format === 'gltf' ? '.glb' : `.${options.format}`;
    return `${options.filename}${ext}`;
  }, [options.filename, options.format]);

  // Format-specific update helpers
  const updateSTEPOption = useCallback(
    <K extends keyof STEPExportOptions>(key: K, value: STEPExportOptions[K]) => {
      updateOption(key, value);
    },
    [updateOption]
  );

  const updateSTLOption = useCallback(
    <K extends keyof STLExportOptions>(key: K, value: STLExportOptions[K]) => {
      updateOption(key, value);
    },
    [updateOption]
  );

  const updateGLTFOption = useCallback(
    <K extends keyof GLTFExportOptions>(key: K, value: GLTFExportOptions[K]) => {
      updateOption(key, value);
    },
    [updateOption]
  );

  // Return typed interface
  const result: UseExportOptionsReturn = {
    options,
    validation,
    setFormat,
    setFilename,
    setUnit,
    updateOption,
    reset,
    getFormattedFilename,
  };

  return result;
}

/**
 * Hook to manage format-specific options
 */
export function useFormatOptions(format: ExportFormat) {
  const [stepVariant, setStepVariant] = useState<'AP203' | 'AP214'>('AP203');
  const [tolerance, setTolerance] = useState(0.01);
  const [stlFormat, setStlFormat] = useState<'binary' | 'ascii'>('binary');
  const [compressed, setCompressed] = useState(false);

  return {
    // STEP
    stepVariant,
    setStepVariant,
    // Common
    tolerance,
    setTolerance,
    // STL
    stlFormat,
    setStlFormat,
    // GLTF
    compressed,
    setCompressed,
  };
}
