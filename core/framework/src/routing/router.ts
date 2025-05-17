import type { Elysia, Handler } from 'elysia';
import { scanRoutes } from './scanner';
import type { ApiRouteModule, DiscoveredRoute, RouteScannerConfig } from '../types/routing';
import { logger } from '../libs/logger';

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
    this.apiRoutes = routes.filter(route => route.type === 'api');
    this.pageRoutes = routes.filter(route => route.type === 'page');
    
    logger.info(`Discovered ${this.apiRoutes.length} API routes and ${this.pageRoutes.length} page routes`);
    
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
      // Dynamically import the route handler module
      const routeModule = await import(route.filePath) as ApiRouteModule;
      
      if (!routeModule) {
        logger.error(`Failed to import API route module: ${route.filePath}`);
        return;
      }
      
      // If a specific HTTP method is defined in the route data, use that handler
      if (route.method && routeModule[route.method]) {
        this.app.route(route.method, route.path, routeModule[route.method] as Handler);
        logger.debug(`Registered ${route.method.toUpperCase()} handler for ${route.path}`);
      } 
      // If no method is specified or found, check if there's a default export
      else if (routeModule.default) {
        // Default export can be used for a GET handler or a handler that handles all methods
        this.app.get(route.path, routeModule.default);
        logger.debug(`Registered default handler for ${route.path}`);
      }
      // If there are method-specific exports, register them all
      else {
        let methodsRegistered = 0;
        
        for (const method of ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const) {
          if (method in routeModule) {
            this.app.route(method, route.path, routeModule[method] as Handler);
            methodsRegistered++;
            logger.debug(`Registered ${method.toUpperCase()} handler for ${route.path}`);
          }
        }
        
        if (methodsRegistered === 0) {
          logger.warn(`No handlers found in module for route: ${route.path}`);
        }
      }
    } catch (error) {
      logger.error(`Error registering API route ${route.path}: ${error}`);
    }
  }
  
  /**
   * Returns all discovered page routes.
   * These will be used by the rendering engine to render React components.
   */
  getPageRoutes(): DiscoveredRoute[] {
    return this.pageRoutes;
  }
}

/**
 * Creates a new Zephra Router instance.
 */
export function createRouter(app: Elysia, config: RouteScannerConfig): Router {
  return new Router(app, config);
} 