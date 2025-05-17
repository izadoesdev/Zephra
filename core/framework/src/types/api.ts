// This file now primarily defines the data structures for API requests and responses,
// rather than the handler signatures themselves, which are Elysia-based (see routing.ts).

export interface ZephraRequest<
  TBody = unknown, // Default body type to unknown
  TQuery = Record<string, string | string[]>, // Query params are strings or arrays of strings
  TParams = Record<string, string> // Route params are strings
> {
  url: URL;
  // method is part of Elysia's context or derived during routing, not directly on this abstract request object.
  headers: Headers;
  query: TQuery;
  params: TParams;
  body: TBody; // Body is present, type is TBody (defaults to unknown)
  context: Record<string, unknown>; // Framework/middleware internal context, distinct from Elysia's context
}

export interface ZephraResponseInit extends ResponseInit {
  // Custom fields for Zephra-specific response handling (if any)
}

/**
 * Defines a standardized handler function signature that operates on an abstracted ZephraRequest.
 * This is an abstraction that could be adapted to/from an Elysia Handler by the framework's core.
 * The `method` for which this handler is called would be known by the routing mechanism.
 */
export type StandardApiHandler<
  TBody = unknown,
  TQuery = Record<string, string | string[]>,
  TParams = Record<string, string>
> = (
  req: ZephraRequest<TBody, TQuery, TParams>
) => Promise<Response> | Response;
