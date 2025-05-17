import type { ZephraResponseInit } from '../types/api';

/**
 * Creates a JSON response.
 * @param data The data to serialize as JSON.
 * @param init Additional response options (status, headers).
 * @returns A Response object.
 */
export function json<TData>(data: TData, init?: ZephraResponseInit): Response {
  const headers = new globalThis.Headers(init?.headers as Bun.HeadersInit | undefined);
  headers.set('Content-Type', 'application/json;charset=utf-8');

  return new globalThis.Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    statusText: init?.statusText,
    headers,
  });
}

/**
 * Creates a text response.
 * @param data The text string.
 * @param init Additional response options (status, headers).
 * @returns A Response object.
 */
export function text(data: string, init?: ZephraResponseInit): Response {
  const headers = new globalThis.Headers(init?.headers as Bun.HeadersInit | undefined);
  headers.set('Content-Type', 'text/plain;charset=utf-8');

  return new globalThis.Response(data, {
    status: init?.status ?? 200,
    statusText: init?.statusText,
    headers,
  });
}

/**
 * Creates an error response, typically in JSON format.
 * @param message The error message.
 * @param status The HTTP status code (defaults to 500).
 * @param init Additional response options (headers, statusText).
 * @returns A Response object.
 */
export function error(
  message: string,
  status = 500,
  init?: Omit<ZephraResponseInit, 'status'>
): Response {
  return json(
    { error: message, success: false, status },
    {
      ...init,
      status,
    }
  );
} 