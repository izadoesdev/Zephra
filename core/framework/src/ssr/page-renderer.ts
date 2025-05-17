import type { Context } from 'elysia';
import pathUtil from 'node:path';
import type { RouteScannerConfig, DiscoveredRoute } from '../types/routing'; // Adjusted path
import type {
  ReactExternals,
  PageComponentType,
  LayoutComponentType,
  ActualLoggerInstance
} from '../types/app'; // Adjusted path
import { htmlErrorString } from '../utils/html-response'; // Adjusted path

export async function handleReactPageRoute(
  ctx: Context,
  pageRoute: DiscoveredRoute,
  config: RouteScannerConfig,
  reactExternals: ReactExternals,
  appLogger: ActualLoggerInstance
): Promise<Response | string> {
  appLogger.debug(`Attempting to render React page: ${pageRoute.path} -> ${pageRoute.filePath}`);
  try {
    if (!reactExternals || !reactExternals.React || !reactExternals.renderToString) {
      appLogger.error('React externals not provided. Cannot render page.');
      ctx.set.status = 500;
      return new Response(htmlErrorString('Server Error', '500 - Configuration Error', 'React externals not available.'), { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    const pageModulePath = pathUtil.resolve(config.appDir, pageRoute.filePath);
    const PageComponent = (await import(pageModulePath)).default as PageComponentType;

    if (typeof PageComponent !== 'function') {
      appLogger.error(`Page component not found or not a function: ${pageModulePath}`);
      ctx.set.status = 500;
      return new Response(htmlErrorString('Server Error', '500 - Server Error', 'Page component could not be loaded.'), { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    let pageElement: React.ReactElement;
    const pageProps = {}; // Minimal props for now
    const layoutProps = {}; // Minimal props for now

    if (pageRoute.layout && typeof pageRoute.layout === 'string') {
      const layoutModulePath = pathUtil.resolve(config.appDir, pageRoute.layout);
      appLogger.debug(`Applying layout: ${layoutModulePath}`);
      const LayoutComponent = (await import(layoutModulePath)).default as LayoutComponentType;

      if (typeof LayoutComponent !== 'function') {
        appLogger.warn(`Layout component not found or not a function: ${layoutModulePath}. Rendering page without layout.`);
        pageElement = reactExternals.React.createElement(PageComponent, pageProps);
      } else {
        const childPageElement = reactExternals.React.createElement(PageComponent, pageProps);
        pageElement = reactExternals.React.createElement(LayoutComponent, layoutProps, childPageElement);
      }
    } else {
      pageElement = reactExternals.React.createElement(PageComponent, pageProps);
    }

    const htmlOutput = reactExternals.renderToString(pageElement);
    return htmlOutput;
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error(String(e));
    appLogger.error(`Error rendering React page ${pageRoute.filePath}: ${error.message}`);
    if (error.stack) appLogger.error(error.stack);
    ctx.set.status = 500;
    return new Response(htmlErrorString('Server Error', '500 - Error During Page Rendering', `${error.message}<br><pre>${error.stack || 'No stack available'}</pre>`), { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
} 