import { Elysia, type Context } from 'elysia';
import { html as elysiaHtmlPlugin } from '@elysiajs/html';
import { logger, createLogger } from './libs/logger';
import { createRouter } from './routing/router';
import type { RouteScannerConfig, DiscoveredRoute } from './types/routing';
import { DEFAULT_CONFIG } from './config/app';
import type {
  ReactExternals,
  ActualLoggerInstance,
  ActualRouterInstance,
  ZephraAppInstance
} from './types/app';
import { handleReactPageRoute } from './ssr/page-renderer';
import { htmlErrorString } from './utils/html-response';

export async function createApp(  // Ensure this export exists
  reactExternals: ReactExternals,
  config: Partial<RouteScannerConfig> = {}
): Promise<ZephraAppInstance> {
  const mergedConfig: RouteScannerConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const appLogger: ActualLoggerInstance = mergedConfig.logPrefix
    ? createLogger(mergedConfig.logPrefix)
    : logger;

  appLogger.info('Initializing Zephra app with React SSR support...');
  appLogger.debug(`App configuration: ${JSON.stringify(mergedConfig, null, 2)}`);

  const baseApp = new Elysia({ name: mergedConfig.appName }).decorate(
    'logger',
    appLogger
  );

  const appWithHtml = baseApp.use(elysiaHtmlPlugin());

  appWithHtml.get('/health', () => ({ status: 'ok', name: mergedConfig.appName }));

  // @ts-ignore - Elysia type inference is not working correctly here. // TODO: Fix this.
  const router: ActualRouterInstance = createRouter(appWithHtml, mergedConfig);

  try {
    await router.scanAllRoutes();
    await router.registerApiRoutes();

    const finalApp = appWithHtml.decorate('router', router);

    const pageRoutes: DiscoveredRoute[] = router.getPageRoutes();

    if (pageRoutes.length > 0) {
      appLogger.info(
        `Found ${pageRoutes.length} page routes for server-side rendering.`
      );

      finalApp.get('*', async (ctx: Context) => {
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
            reactExternals,
            appLogger
          );
        }

        appLogger.debug(`No page route found for path: ${normalizedPath}`);
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
      finalApp.get('*', (ctx: Context) => {
        appLogger.warn('No page routes defined. Catch-all returning 404.');
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

    appLogger.info(
      'Zephra app initialized successfully with React SSR enabled.'
    );
    return finalApp;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    appLogger.error(`Error initializing Zephra app: ${error.message}`);
    if (error.stack) appLogger.error(error.stack);
    throw error;
  }
} 