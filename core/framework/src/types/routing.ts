import type { Handler, Context as ElysiaContext } from 'elysia';
import type ElysiaClass from 'elysia';

/**
 * Represents the HTTP methods Zephra will support for file-based routing.
 * Standardized to uppercase.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Structure representing a discovered route.
 */
export interface DiscoveredRoute {
  /** The absolute path to the route handler file. */
  filePath: string;
  /** The URL path for this route (e.g., '/users/:id'). */
  path: string;
  /** The HTTP method, if specified by filename (e.g., 'get', 'post'), otherwise undefined for API routes. */
  method?: HttpMethod;
  /** Indicates if the route is an API endpoint or a page. */
  type: 'api' | 'page';
  /** The logical name of the route, often derived from the file or directory name. */
  name: string;
  /** Depth of the route in the file structure, used for ordering or layout nesting. */
  depth: number;
  /** The actual handler function, to be loaded dynamically. */
  handler?: Handler;
  /** Is this a dynamic route? (e.g. /posts/[id].ts) */
  isDynamic: boolean;
  /** The absolute path to the layout file for page routes. Only applicable for type: 'page'. */
  layout?: string;
}

/**
 * Configuration for the route scanner.
 */
export interface RouteScannerConfig {
  /** The base directory for the application code (e.g., 'apps/web/app'). */
  appDir: string;
  /** The directory name for API routes (e.g., 'api'). */
  apiDir: string;
  /** The directory name for page routes (e.g., 'pages'). */
  pagesDir?: string;
  /** Optional prefix for logger instances created by the framework for this app. */
  logPrefix?: string;
  /** Optional application name, used in logging or default route responses. */
  appName?: string;
}

export type ElysiaInstance = InstanceType<typeof ElysiaClass>;

/**
 * Type for a module exporting Elysia route handlers.
 * Example: export const GET = (context: ElysiaContext) => { ... }
 * A module can export multiple handlers for different HTTP methods.
 */
export type ApiRouteModule = Partial<Record<HttpMethod, Handler>> & {
  /** A default export can be a handler, an Elysia instance, or undefined. */
  default?: Handler | ElysiaInstance;
};

/**
 * Type for a page component module (React component).
 * This is a placeholder and will be refined when React integration happens.
 */
export interface PageRouteModule {
  /** A React component or a function that returns renderable content. */
  default: () => unknown; // Or specific React component type e.g. React.FC, JSX.Element
} 