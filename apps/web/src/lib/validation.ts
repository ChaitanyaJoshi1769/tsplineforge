/**
 * Comprehensive validation and sanitization library
 * Provides validators for common input types and sanitization for security
 */

// ============= VALIDATORS =============

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class Validators {
  /**
   * Email validation
   */
  static email(value: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, error: 'Invalid email address' };
    }
    return { valid: true };
  }

  /**
   * Password validation with strength requirements
   */
  static password(
    value: string,
    options?: {
      minLength?: number;
      requireUppercase?: boolean;
      requireNumber?: boolean;
      requireSpecial?: boolean;
    },
  ): ValidationResult {
    const {
      minLength = 8,
      requireUppercase = true,
      requireNumber = true,
      requireSpecial = true,
    } = options || {};

    if (value.length < minLength) {
      return {
        valid: false,
        error: `Password must be at least ${minLength} characters`,
      };
    }

    if (requireUppercase && !/[A-Z]/.test(value)) {
      return {
        valid: false,
        error: 'Password must contain at least one uppercase letter',
      };
    }

    if (requireNumber && !/\d/.test(value)) {
      return {
        valid: false,
        error: 'Password must contain at least one number',
      };
    }

    if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return {
        valid: false,
        error: 'Password must contain at least one special character',
      };
    }

    return { valid: true };
  }

  /**
   * URL validation
   */
  static url(value: string): ValidationResult {
    try {
      new URL(value);
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL' };
    }
  }

  /**
   * Phone number validation (international format)
   */
  static phone(value: string): ValidationResult {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(value)) {
      return { valid: false, error: 'Invalid phone number' };
    }
    return { valid: true };
  }

  /**
   * Number validation
   */
  static number(
    value: string | number,
    options?: {
      min?: number;
      max?: number;
      integer?: boolean;
    },
  ): ValidationResult {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) {
      return { valid: false, error: 'Invalid number' };
    }

    const { min, max, integer = false } = options || {};

    if (integer && !Number.isInteger(num)) {
      return { valid: false, error: 'Must be a whole number' };
    }

    if (min !== undefined && num < min) {
      return { valid: false, error: `Must be at least ${min}` };
    }

    if (max !== undefined && num > max) {
      return { valid: false, error: `Must be at most ${max}` };
    }

    return { valid: true };
  }

  /**
   * String length validation
   */
  static string(
    value: string,
    options?: {
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
    },
  ): ValidationResult {
    const { minLength, maxLength, pattern } = options || {};

    if (minLength !== undefined && value.length < minLength) {
      return {
        valid: false,
        error: `Must be at least ${minLength} characters`,
      };
    }

    if (maxLength !== undefined && value.length > maxLength) {
      return {
        valid: false,
        error: `Must be no more than ${maxLength} characters`,
      };
    }

    if (pattern && !pattern.test(value)) {
      return {
        valid: false,
        error: 'Invalid format',
      };
    }

    return { valid: true };
  }

  /**
   * Confirm password validation
   */
  static confirmPassword(password: string, confirm: string): ValidationResult {
    if (password !== confirm) {
      return { valid: false, error: 'Passwords do not match' };
    }
    return { valid: true };
  }

  /**
   * Checkbox/required validation
   */
  static required(value: string | boolean | null | undefined): ValidationResult {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return { valid: false, error: 'This field is required' };
    }
    return { valid: true };
  }
}

// ============= SANITIZERS =============

export class Sanitizers {
  /**
   * Remove HTML and script tags to prevent XSS
   */
  static html(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Trim whitespace
   */
  static trim(input: string): string {
    return input.trim();
  }

  /**
   * Remove special characters
   */
  static alphanumeric(input: string, allowSpaces = false): string {
    const pattern = allowSpaces ? /[^a-zA-Z0-9\s]/g : /[^a-zA-Z0-9]/g;
    return input.replace(pattern, '');
  }

  /**
   * Normalize whitespace (multiple spaces to single space)
   */
  static normalizeWhitespace(input: string): string {
    return input.replace(/\s+/g, ' ').trim();
  }

  /**
   * Email sanitization
   */
  static email(input: string): string {
    return this.trim(input).toLowerCase();
  }

  /**
   * URL sanitization
   */
  static url(input: string): string {
    try {
      const url = new URL(input);
      // Only allow safe protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return '';
      }
      return url.toString();
    } catch {
      return '';
    }
  }

  /**
   * File name sanitization
   */
  static fileName(input: string): string {
    // Remove path separators and unsafe characters
    return input
      .replace(/[/\\]/g, '')
      .replace(/[<>:"|?*]/g, '')
      .replace(/\s+/g, '_')
      .trim();
  }

  /**
   * Number sanitization
   */
  static number(input: string, allowDecimals = false): string {
    if (allowDecimals) {
      return input.replace(/[^\d.-]/g, '');
    }
    return input.replace(/[^\d-]/g, '');
  }

  /**
   * Phone number sanitization
   */
  static phone(input: string): string {
    return input.replace(/[^\d+\-() ]/g, '').trim();
  }

  /**
   * Remove null bytes
   */
  static nullBytes(input: string): string {
    return input.replace(/\0/g, '');
  }

  /**
   * Remove control characters
   */
  static controlChars(input: string): string {
    // eslint-disable-next-line no-control-regex
    return input.replace(/[\x00-\x1F\x7F]/g, '');
  }

  /**
   * Comprehensive sanitization for user input
   */
  static userInput(input: string): string {
    return this.controlChars(
      this.nullBytes(this.normalizeWhitespace(this.html(this.trim(input)))),
    );
  }
}

// ============= FIELD VALIDATOR CLASS =============

export interface FieldValidatorOptions {
  validators: Array<() => ValidationResult>;
  sanitizers?: Array<(value: string) => string>;
}

export class FieldValidator {
  private validators: Array<() => ValidationResult>;
  private sanitizers: Array<(value: string) => string>;

  constructor(options: FieldValidatorOptions) {
    this.validators = options.validators;
    this.sanitizers = options.sanitizers || [];
  }

  sanitize(value: string): string {
    return this.sanitizers.reduce((acc, sanitizer) => sanitizer(acc), value);
  }

  validate(): ValidationResult {
    for (const validator of this.validators) {
      const result = validator();
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  }
}
