import type { ApiError } from './types';

export interface ApiErrorResponse {
  error: ApiError;
}

export const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (!value || typeof value !== 'object') return false;

  const maybeError = (value as { error?: unknown }).error;
  if (!maybeError || typeof maybeError !== 'object') return false;

  const error = maybeError as Partial<ApiError>;
  return typeof error.code === 'string' && typeof error.message === 'string';
};
