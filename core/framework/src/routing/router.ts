import type { Elysia, Handler } from 'elysia';
import { scanRoutes } from './scanner';
import type { ApiRouteModule, DiscoveredRoute, RouteScannerConfig } from '../types/routing';
import { logger, writeDiagnostics } from '../libs/logger';
import { sqliteManager } from '../libs/sqliteManager';

/**
 * The Router is responsible for scanning routes and registering them with the Elysia app.
 * It separates API routes (which get registered directly) and page routes (which will be
 * handled by the rendering engine).
 */
export class Router {
  private app: Elysia;
  private config: RouteScannerConfig;
  
  private apiRoutes: DiscoveredRoute[] = [];
  private pageRoutes: DiscoveredRoute[] = [];
  
  constructor(app: Elysia, config: RouteScannerConfig) {
    this.app = app;
    this.config = config;
  }
  
  /**
   * Scans for routes and categorizes them as API or page routes.
   */
  async scanAllRoutes(): Promise<{ apiRoutes: DiscoveredRoute[], pageRoutes: DiscoveredRoute[] }> {
    const routes = await scanRoutes(this.config);
    
    // Separate routes by type
    this.apiRoutes = routes.apiRoutes;
    this.pageRoutes = routes.pageRoutes;
    
    await writeDiagnostics({
      timestamp: new Date().toISOString(),
      apiRoutes: this.apiRoutes,
      pageRoutes: this.pageRoutes
    });
    
    return {
      apiRoutes: this.apiRoutes,
      pageRoutes: this.pageRoutes
    };
  }
  
  /**
   * Registers all API routes with the Elysia app.
   */
  async registerApiRoutes(): Promise<Elysia> {
    if (this.apiRoutes.length === 0) {
      logger.warn('No API routes to register. Did you call scanAllRoutes() first?');
      return this.app;
    }
    
    for (const route of this.apiRoutes) {
      await this.registerApiRoute(route);
    }
    
    return this.app;
  }
  
  /**
   * Dynamically imports and registers a single API route with the Elysia app.
   */
  private async registerApiRoute(route: DiscoveredRoute): Promise<void> {
    try {
      const routeModule = await import(route.filePath) as ApiRouteModule;
      if (!routeModule) {
        logger.error(`Failed to import API route module: ${route.filePath}`);
        return;
      }

      const apiPrefixedPath = this.getApiPrefixedPath(route.path);
      const registrationStart = performance.now();
      let registrationType = 'unknown';
      let label = apiPrefixedPath;
      let method: string | undefined = undefined;
      let meta: Record<string, unknown> = { filePath: route.filePath };

      if (
        routeModule.default &&
        typeof routeModule.default === 'object' &&
        typeof routeModule.default.use === 'function' &&
        typeof routeModule.default.handle === 'function'
      ) {
        if (route.path !== '/' && route.path !== '') {
          logger.warn(`Route ${route.filePath} uses 'app.use' with path '${route.path}'. Prefixing with '/api' might not be intended here. Manual review advised if it's not a global middleware or self-contained plugin.`);
        }
        // Mount at parent path if dynamic segment exists
        const dynamicIndex = apiPrefixedPath.indexOf('/:');
        const mountPath = dynamicIndex !== -1 ? apiPrefixedPath.substring(0, dynamicIndex) : apiPrefixedPath;
        this.app.mount(mountPath, routeModule.default as Elysia);
        registrationType = 'plugin-mount';
        label = mountPath;
        meta = { ...meta, mountPath };
        const duration = performance.now() - registrationStart;
        sqliteManager.insertPerformanceDiagnostic({
          timestamp: new Date().toISOString(),
          type: 'api-route-registration',
          label,
          duration_ms: duration,
          meta: { ...meta, registrationType }
        });
        return;
      }
      // Legacy: If a specific HTTP method is defined in the route data, use that handler
      if (route.method && routeModule[route.method]) {
        this.app.route(route.method, apiPrefixedPath, routeModule[route.method] as Handler);
        registrationType = 'method-handler';
        method = route.method;
        label = `${apiPrefixedPath} [${method}]`;
        meta = { ...meta, method };
        const duration = performance.now() - registrationStart;
        sqliteManager.insertPerformanceDiagnostic({
          timestamp: new Date().toISOString(),
          type: 'api-route-registration',
          label,
          duration_ms: duration,
          meta: { ...meta, registrationType }
        });
      } else if (routeModule.default) {
        this.app.get(apiPrefixedPath, routeModule.default);
        registrationType = 'default-get-handler';
        method = 'GET';
        label = `${apiPrefixedPath} [GET]`;
        meta = { ...meta, method };
        const duration = performance.now() - registrationStart;
        sqliteManager.insertPerformanceDiagnostic({
          timestamp: new Date().toISOString(),
          type: 'api-route-registration',
          label,
          duration_ms: duration,
          meta: { ...meta, registrationType }
        });
      } else {
        let methodsRegistered = 0;
        for (const method of ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'] as const) {
          if (method in routeModule) {
            this.app.route(method, apiPrefixedPath, routeModule[method] as Handler);
            registrationType = 'multi-method-handler';
            label = `${apiPrefixedPath} [${method}]`;
            meta = { ...meta, method };
            const duration = performance.now() - registrationStart;
            sqliteManager.insertPerformanceDiagnostic({
              timestamp: new Date().toISOString(),
              type: 'api-route-registration',
              label,
              duration_ms: duration,
              meta: { ...meta, registrationType }
            });
            methodsRegistered++;
          }
        }
        if (methodsRegistered === 0) {
          logger.warn(`No handlers found in module for route: ${apiPrefixedPath}`);
        }
      }
    } catch (error) {
      logger.error(`Error registering API route ${route.path}, ${error}`);
    }
  }
  
  /**
   * Returns all discovered page routes.
   * These will be used by the rendering engine to render React components.
   */
  getPageRoutes(): DiscoveredRoute[] {
    return this.pageRoutes;
  }

  /**
   * Ensures the route path is prefixed with /api exactly once.
   */
  private getApiPrefixedPath(path: string): string {
    if (path === '/') return '/api';
    return path.startsWith('/api') ? path : `/api${path}`;
  }
}

/**
 * Creates a new Zephra Router instance.
 */
export function createRouter(app: Elysia, config: RouteScannerConfig): Router {
  return new Router(app, config);
} 