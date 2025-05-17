import type { Context } from 'elysia';
import pathUtil from 'node:path';
import type { RouteScannerConfig, DiscoveredRoute } from '../types/routing'; // Adjusted path
import type {
  PageComponentType,
  LayoutComponentType,
  ActualLoggerInstance
} from '../types/app'; // Adjusted path
import { htmlErrorString } from '../utils/html-response'; // Adjusted path
import React from 'react';
import { renderToString } from 'react-dom/server';

export async function handleReactPageRoute(
  ctx: Context,
  pageRoute: DiscoveredRoute,
  config: RouteScannerConfig,
  appLogger: ActualLoggerInstance
): Promise<Response | string> {
  appLogger.debug(`Attempting to render React page: ${pageRoute.path} -> ${pageRoute.filePath}`);
  try {
    const pageModulePath = pathUtil.resolve(config.appDir, pageRoute.filePath);
    const PageComponent = (await import(pageModulePath)).default as PageComponentType;
    if (typeof PageComponent !== 'function') {
      appLogger.error(`Page component not found or not a function: ${pageModulePath}`);
      ctx.set.status = 500;
      return new Response(htmlErrorString('Server Error', '500 - Server Error', 'Page component could not be loaded.'), { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    let pageElement: React.ReactElement;
    const pageProps = {}; // Minimal props for now
    const layoutProps = {};
    if (pageRoute.layout && typeof pageRoute.layout === 'string') {
      const layoutModulePath = pathUtil.resolve(config.appDir, pageRoute.layout);
      appLogger.debug(`Applying layout: ${layoutModulePath}`);
      const LayoutComponent = (await import(layoutModulePath)).default as LayoutComponentType;
      if (typeof LayoutComponent !== 'function') {
        appLogger.warn(`Layout component not found or not a function: ${layoutModulePath}. Rendering page without layout.`);
        pageElement = React.createElement(PageComponent, pageProps);
      } else {
        const childPageElement = React.createElement(PageComponent, pageProps);
        pageElement = React.createElement(LayoutComponent, layoutProps, childPageElement);
      }
    } else {
      pageElement = React.createElement(PageComponent, pageProps);
    }
    const htmlOutput = renderToString(pageElement);
    return htmlOutput;
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error(String(e));
    appLogger.error(`Error rendering React page ${pageRoute.filePath}: ${error.message}`);
    if (error.stack) appLogger.error(error.stack);
    ctx.set.status = 500;
    return new Response(htmlErrorString('Server Error', '500 - Error During Page Rendering', `${error.message}<br><pre>${error.stack || 'No stack available'}</pre>`), { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
} 