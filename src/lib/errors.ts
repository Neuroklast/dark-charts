import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type RouteContext = { params?: Promise<Record<string, string>> };

type RouteHandler = (
  req: NextRequest,
  context?: RouteContext
) => Promise<NextResponse>;

function formatErrorBody(
  message: string,
  status: number,
  code?: string,
  details?: unknown
) {
  return {
    error: message,
    code,
    status,
    ...(details !== undefined ? { details } : {}),
  };
}

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context?: RouteContext) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          formatErrorBody(error.message, error.status, error.code),
          { status: error.status }
        );
      }

      if (error instanceof ZodError) {
        return NextResponse.json(
          formatErrorBody('Validation error', 400, 'VALIDATION_ERROR', error.format()),
          { status: 400 }
        );
      }

      logger.error('Unhandled API error', { error });
      return NextResponse.json(
        formatErrorBody('Internal server error', 500, 'INTERNAL_ERROR'),
        { status: 500 }
      );
    }
  };
}