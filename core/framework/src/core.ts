import { Elysia, type Context } from 'elysia';
import { html as elysiaHtmlPlugin } from '@elysiajs/html';
import { logger as baseLogger, createLogger } from './libs/logger';
import { createRouter } from './routing/router';
import type { RouteScannerConfig, DiscoveredRoute } from './types/routing';
import { DEFAULT_CONFIG } from './config/app';
import type {
  Logger,
  Router,
  ZephraAppInstance
} from './types/app';
import { handleReactPageRoute } from './ssr/page-renderer';
import { startHMRServer } from './hmr/hmr-server';
import { staticPlugin } from '@elysiajs/static';
import React from 'react';
import { renderToString } from 'react-dom/server';
import NotFoundPage from './pages/NotFoundPage';
import ErrorPage from './pages/ErrorPage';
if (process.env.NODE_ENV !== 'production') {
  startHMRServer({ watchDir: process.cwd() });
}

export async function createApp(
  config: Partial<RouteScannerConfig> = {}
): Promise<ZephraAppInstance> {
  const mergedConfig: RouteScannerConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const logger: Logger = mergedConfig.logPrefix
    ? createLogger(mergedConfig.logPrefix)
    : baseLogger;

  logger.info('Initializing Zephra app with React SSR support...');
  logger.debug(`App configuration: ${JSON.stringify(mergedConfig, null, 2)}`);

  const baseApp = new Elysia({ name: mergedConfig.appName }).decorate(
    'logger',
    logger
  );
 
  baseApp.use(elysiaHtmlPlugin());
  baseApp.use(staticPlugin({ prefix: '/public' }));

  baseApp.get('/health', () => ({ status: 'ok', name: mergedConfig.appName }));

  // @ts-ignore - Elysia type inference is not working correctly here. // TODO: Fix this.
  const router: ActualRouterInstance = createRouter(baseApp, mergedConfig);

  try {
    await router.scanAllRoutes();
    await router.registerApiRoutes();

    baseApp.decorate('router', router);

    const pageRoutes: DiscoveredRoute[] = router.getPageRoutes();

    if (pageRoutes.length > 0) {
      baseApp.get('*', async (ctx: Context) => {
        const requestPath = new URL(ctx.request.url).pathname;
        const normalizedPath =
          requestPath === '/' ? '/' : requestPath.replace(/\/+$/, '');

        logger.info(`[ROUTE] Incoming request: path='${requestPath}', normalized='${normalizedPath}'`);

        // If it's an API route, return JSON 404
        if (normalizedPath.startsWith('/api')) {
          ctx.set.status = 404;
          return new Response(JSON.stringify({ error: 'Not found', path: normalizedPath }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const pageRoute = pageRoutes.find(
          (r) => r.path === normalizedPath && r.type === 'page'
        );

        if (pageRoute) {
          logger.info(`[ROUTE] Matched page route: path='${pageRoute.path}', file='${pageRoute.filePath}'`);
          try {
            return await handleReactPageRoute(
              ctx,
              pageRoute,
              mergedConfig,
              logger
            );
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            logger.error(`[RENDER] Error rendering page route '${normalizedPath}': ${error.message}`);
            if (error.stack) logger.error(error.stack);
            ctx.set.status = 500;
            const html = renderToString(React.createElement(ErrorPage, { error: error.message }));
            return new Response(`<!DOCTYPE html>${html}`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
          }
        }

        logger.error(`[ROUTE] No page route found for path: '${normalizedPath}'. Available routes: [${pageRoutes.map(r => r.path).join(', ')}]`);
        ctx.set.status = 404;
        const html = renderToString(React.createElement(NotFoundPage));
        return new Response(`<!DOCTYPE html>${html}`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      });
    } else {
      baseApp.get('*', (ctx: Context) => {
        logger.error('No page routes defined. Catch-all returning 404.');
        ctx.set.status = 404;
        const html = renderToString(React.createElement(NotFoundPage));
        return new Response(`<!DOCTYPE html>${html}`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      });
    }

    logger.info('Zephra app initialized successfully with React SSR enabled.');

    // @ts-ignore - Elysia type inference is not working correctly here. // TODO: Fix this.
    return baseApp as unknown as ZephraAppInstance;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(`[INIT] Error initializing Zephra app: ${error.message}`);
    if (error.stack) logger.error(error.stack);
    throw error;
  }
} 