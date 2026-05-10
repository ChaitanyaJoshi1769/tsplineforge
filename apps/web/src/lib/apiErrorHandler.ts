/**
 * Comprehensive API error handling and retry logic
 * Provides error classification, user-friendly messages, and automatic retries
 */

export enum ErrorType {
  // Client errors
  BadRequest = 'BAD_REQUEST',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  Conflict = 'CONFLICT',
  TooManyRequests = 'TOO_MANY_REQUESTS',
  UnprocessableEntity = 'UNPROCESSABLE_ENTITY',

  // Server errors
  InternalServerError = 'INTERNAL_SERVER_ERROR',
  NotImplemented = 'NOT_IMPLEMENTED',
  BadGateway = 'BAD_GATEWAY',
  ServiceUnavailable = 'SERVICE_UNAVAILABLE',
  GatewayTimeout = 'GATEWAY_TIMEOUT',

  // Network errors
  NetworkError = 'NETWORK_ERROR',
  Timeout = 'TIMEOUT',

  // Unknown error
  Unknown = 'UNKNOWN',
}

export interface ApiErrorResponse {
  status: number;
  message: string;
  errorType: ErrorType;
  userMessage: string;
  details?: Record<string, unknown>;
  timestamp: number;
  retryable: boolean;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly errorType: ErrorType;
  public readonly userMessage: string;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: number;
  public readonly retryable: boolean;
  public readonly headers?: Record<string, string>;

  constructor(response: ApiErrorResponse) {
    super(response.message);
    this.name = 'ApiError';
    this.status = response.status;
    this.errorType = response.errorType;
    this.userMessage = response.userMessage;
    this.details = response.details;
    this.timestamp = response.timestamp;
    this.retryable = response.retryable;
    this.headers = response.headers;
  }
}

// ============= ERROR CLASSIFICATION =============

/**
 * Determine error type from HTTP status code
 */
export function getErrorTypeFromStatus(status: number): ErrorType {
  if (status === 400) return ErrorType.BadRequest;
  if (status === 401) return ErrorType.Unauthorized;
  if (status === 403) return ErrorType.Forbidden;
  if (status === 404) return ErrorType.NotFound;
  if (status === 409) return ErrorType.Conflict;
  if (status === 422) return ErrorType.UnprocessableEntity;
  if (status === 429) return ErrorType.TooManyRequests;
  if (status === 500) return ErrorType.InternalServerError;
  if (status === 501) return ErrorType.NotImplemented;
  if (status === 502) return ErrorType.BadGateway;
  if (status === 503) return ErrorType.ServiceUnavailable;
  if (status === 504) return ErrorType.GatewayTimeout;
  return ErrorType.Unknown;
}

/**
 * Determine if error is retryable
 */
export function isRetryable(error: ApiError | Error): boolean {
  if (error instanceof ApiError) {
    return error.retryable;
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true; // Network errors are retryable
  }

  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(errorType: ErrorType): string {
  const messages: Record<ErrorType, string> = {
    [ErrorType.BadRequest]: 'The request was invalid. Please check your input.',
    [ErrorType.Unauthorized]: 'You are not authenticated. Please log in.',
    [ErrorType.Forbidden]: 'You do not have permission to access this resource.',
    [ErrorType.NotFound]: 'The requested resource was not found.',
    [ErrorType.Conflict]: 'The request conflicts with the current state.',
    [ErrorType.TooManyRequests]: 'Too many requests. Please try again later.',
    [ErrorType.UnprocessableEntity]: 'The request contains invalid data.',
    [ErrorType.InternalServerError]: 'Server error. Please try again later.',
    [ErrorType.NotImplemented]: 'This feature is not implemented.',
    [ErrorType.BadGateway]: 'Service temporarily unavailable. Please try again.',
    [ErrorType.ServiceUnavailable]: 'The service is temporarily unavailable.',
    [ErrorType.GatewayTimeout]: 'Request timed out. Please try again.',
    [ErrorType.NetworkError]: 'Network error. Please check your connection.',
    [ErrorType.Timeout]: 'Request timed out. Please try again.',
    [ErrorType.Unknown]: 'An unexpected error occurred. Please try again.',
  };

  return messages[errorType] || messages[ErrorType.Unknown];
}

// ============= ERROR HANDLER =============

export interface ApiErrorHandlerOptions {
  onUnauthorized?: () => void;
  onForbidden?: () => void;
  onServerError?: () => void;
  logErrors?: boolean;
}

export class ApiErrorHandler {
  private options: ApiErrorHandlerOptions;

  constructor(options: ApiErrorHandlerOptions = {}) {
    this.options = {
      logErrors: true,
      ...options,
    };
  }

  /**
   * Handle API errors with appropriate responses
   */
  handleError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return this.processApiError(error);
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return this.handleNetworkError(error);
    }

    // Unknown error
    return new ApiError({
      status: 0,
      message: error instanceof Error ? error.message : String(error),
      errorType: ErrorType.Unknown,
      userMessage: getUserMessage(ErrorType.Unknown),
      timestamp: Date.now(),
      retryable: false,
    });
  }

  /**
   * Process API error and trigger callbacks
   */
  private processApiError(error: ApiError): ApiError {
    if (this.options.logErrors) {
      // eslint-disable-next-line no-console
      console.error(`[API Error] ${error.errorType}: ${error.message}`, error.details);
    }

    if (error.status === 401 && this.options.onUnauthorized) {
      this.options.onUnauthorized();
    }

    if (error.status === 403 && this.options.onForbidden) {
      this.options.onForbidden();
    }

    if (error.status >= 500 && this.options.onServerError) {
      this.options.onServerError();
    }

    return error;
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(error: TypeError): ApiError {
    const apiError = new ApiError({
      status: 0,
      message: error.message,
      errorType: ErrorType.NetworkError,
      userMessage: getUserMessage(ErrorType.NetworkError),
      timestamp: Date.now(),
      retryable: true,
    });

    return this.processApiError(apiError);
  }
}

// ============= RETRY LOGIC =============

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: ApiError) => boolean;
}

export class RetryHandler {
  private maxAttempts: number;
  private initialDelayMs: number;
  private maxDelayMs: number;
  private backoffMultiplier: number;
  private shouldRetry: (error: ApiError) => boolean;
  private errorHandler: ApiErrorHandler;

  constructor(options: RetryOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 3;
    this.initialDelayMs = options.initialDelayMs ?? 1000;
    this.maxDelayMs = options.maxDelayMs ?? 30000;
    this.backoffMultiplier = options.backoffMultiplier ?? 2;
    this.shouldRetry = options.shouldRetry ?? ((error) => isRetryable(error));
    this.errorHandler = new ApiErrorHandler({ logErrors: true });
  }

  /**
   * Execute fetch with automatic retry logic
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fetch<T>(url: string, options?: RequestInit): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lastError: ApiError | any = null;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          const errorType = getErrorTypeFromStatus(response.status);
          const retryable =
            response.status >= 500 || response.status === 429 || response.status === 408;

          let details: Record<string, unknown> | undefined;
          try {
            const data = await response.json();
            details = data;
          } catch {
            // Response is not JSON
          }

          const error = new ApiError({
            status: response.status,
            message: `HTTP ${response.status}`,
            errorType,
            userMessage: getUserMessage(errorType),
            timestamp: Date.now(),
            retryable,
            details,
            headers: Object.fromEntries(response.headers.entries()),
          });

          lastError = this.errorHandler.handleError(error);
          if (attempt === this.maxAttempts || !this.shouldRetry(lastError)) {
            throw lastError;
          }
        } else {
          return response.json();
        }
      } catch (error) {
        lastError = this.errorHandler.handleError(error);

        if (attempt === this.maxAttempts || !this.shouldRetry(lastError)) {
          throw lastError;
        }

        // Calculate backoff delay
        const delayMs = Math.min(
          this.initialDelayMs * Math.pow(this.backoffMultiplier, attempt - 1),
          this.maxDelayMs,
        );

        // Add jitter (±10%)
        const jitter = delayMs * 0.1 * (Math.random() * 2 - 1);
        const actualDelay = Math.max(delayMs + jitter, 0);

        await new Promise((resolve) => setTimeout(resolve, actualDelay));
      }
    }

    throw lastError || new Error('Retry failed');
  }

  /**
   * Calculate backoff delay with exponential backoff and jitter
   */
  getBackoffDelay(attempt: number): number {
    const exponentialDelay = this.initialDelayMs * Math.pow(this.backoffMultiplier, attempt);
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs);
    const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);
    return Math.max(cappedDelay + jitter, 0);
  }
}

// ============= REACT HOOK =============

import { useState, useCallback } from 'react';

export interface UseApiOptions extends RetryOptions {
  onError?: (error: ApiError) => void;
  onSuccess?: (data: unknown) => void;
  onUnauthorized?: () => void;
}

export interface UseApiState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  execute: (url: string, options?: RequestInit) => Promise<T>;
}

export function useApi<T>(options: UseApiOptions = {}): UseApiState<T> {
  const [state, setState] = useState<Omit<UseApiState<T>, 'execute'>>({
    data: null,
    error: null,
    loading: false,
  });

  const retryHandler = new RetryHandler(options);

  const execute = useCallback(
    async (url: string, fetchOptions?: RequestInit): Promise<T> => {
      setState({ data: null, error: null, loading: true });

      try {
        const data = await retryHandler.fetch<T>(url, fetchOptions);
        setState({ data, error: null, loading: false });
        options.onSuccess?.(data);
        return data;
      } catch (error) {
        const errorHandler = new ApiErrorHandler({
          onUnauthorized: options.onUnauthorized,
        });
        const apiError = errorHandler.handleError(error);
        setState({ data: null, error: apiError, loading: false });
        options.onError?.(apiError);
        throw apiError;
      }
    },
    [retryHandler, options],
  );

  return {
    ...state,
    execute,
  };
}
