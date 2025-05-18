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
import { htmlErrorString } from './utils/html-response';
import { startHMRServer } from './hmr/hmr-server';
import { staticPlugin } from '@elysiajs/static';

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
  baseApp.use(staticPlugin({ assets: '.zephra', prefix: '/' }));

  baseApp.get('/health', () => ({ status: 'ok', name: mergedConfig.appName }));

  // @ts-ignore - Elysia type inference is not working correctly here. // TODO: Fix this.
  const router: ActualRouterInstance = createRouter(baseApp, mergedConfig);

  try {
    await router.scanAllRoutes();
    await router.registerApiRoutes();

    baseApp.decorate('router', router);

    const pageRoutes: DiscoveredRoute[] = router.getPageRoutes();

    if (pageRoutes.length > 0) {
      logger.info(
        `Found ${pageRoutes.length} page routes for server-side rendering.`
      );

      baseApp.get('*', async (ctx: Context) => {
        const requestPath = new URL(ctx.request.url).pathname;
        const normalizedPath =
          requestPath === '/' ? '/' : requestPath.replace(/\/+$/, '');

        const pageRoute = pageRoutes.find(
          (r) => r.path === normalizedPath && r.type === 'page'
        );

        if (pageRoute) {
          return handleReactPageRoute(
            ctx,
            pageRoute,
            mergedConfig,
            logger
          );
        }

        logger.debug(`No page route found for path: ${normalizedPath}`);
        ctx.set.status = 404;
        return new Response(
          htmlErrorString(
            'Not Found',
            '404 - Page Not Found',
            `The requested path ${normalizedPath} was not found.`
          ),
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      });
    } else {
      baseApp.get('*', (ctx: Context) => {
        logger.warn('No page routes defined. Catch-all returning 404.');
        ctx.set.status = 404;
        return new Response(
          htmlErrorString(
            'Not Found',
            '404 - No Pages Defined',
            'The application has not defined any page routes.'
          ),
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      });
    }

    logger.info(
      'Zephra app initialized successfully with React SSR enabled.'
    );

    // @ts-ignore - Elysia type inference is not working correctly here. // TODO: Fix this.
    return baseApp as unknown as ZephraAppInstance;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(`Error initializing Zephra app: ${error.message}`);
    if (error.stack) logger.error(error.stack);
    throw error;
  }
} 