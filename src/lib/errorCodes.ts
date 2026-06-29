export type ErrorCode =
  | 'SERVER_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  SERVER_ERROR: 'An unexpected server error occurred.',
  VALIDATION_ERROR: 'The request failed validation.',
  UNAUTHORIZED: 'Authentication is required.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
}