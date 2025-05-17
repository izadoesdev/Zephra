import { describe, it, expect, mock, spyOn, beforeEach, afterEach } from 'bun:test';
import { handleReactPageRoute } from '../../ssr/page-renderer'; // Adjusted path
import { htmlErrorString } from '../../utils/html-response'; // Adjusted path
import type { Context } from 'elysia';
import type { RouteScannerConfig, DiscoveredRoute } from '../../types/routing';
import type { ReactExternals, ActualLoggerInstance } from '../../types/app';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import pathUtil from 'node:path';

// Mock React and renderToString
mock.module('react', () => ({
  createElement: mock(() => 'mocked_react_element'),
}));
mock.module('react-dom/server', () => ({
  renderToString: mock(() => 'mocked_html_output'),
}));

// Mock dynamic import
const mockDynamicImport = mock(async (modulePath: string) => {
  if (modulePath.includes('NonFunctionPage')) {
    return { default: 'not_a_function' };
  }
  if (modulePath.includes('Page')) {
    return { default: mock(() => 'PageComponentContent') }; // Mock component function
  }
  if (modulePath.includes('Layout')) {
    return { default: mock((props: { children: React.ReactNode }) => `LayoutStart-${props.children}-LayoutEnd`) }; // Mock layout function
  }
  if (modulePath.includes('NonFunctionLayout')) {
    return { default: 'not_a_function_layout' };
  }
  throw new Error(`Module not found: ${modulePath}`);
});

// Spy on pathUtil.resolve if needed, or ensure paths are predictable
// For these tests, we'll assume import.meta.dir resolves correctly or paths are mocked

describe('handleReactPageRoute', () => {
  let mockCtx: Partial<Context>;
  let mockConfig: RouteScannerConfig;
  let mockReactExternals: ReactExternals;
  let mockLogger: ActualLoggerInstance;

  beforeEach(() => {
    mockCtx = {
      request: new Request('http://localhost/test'),
      set: { status: 0 }, // Reset status
    } as Partial<Context>;

    mockConfig = {
      appDir: '/mock/app', // Using a mock directory
      apiDir: 'app/api',
      pagesDir: 'app',
      appName: 'TestApp',
      logPrefix: 'test',
    };

    mockReactExternals = {
      React: React as typeof React, // Use the mocked version
      renderToString: ReactDOMServer.renderToString as typeof ReactDOMServer.renderToString, // Use the mocked version
    };

    mockLogger = {
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
      debug: mock(() => {}),
      // Add other logger methods if your ActualLoggerInstance has them
    } as unknown as ActualLoggerInstance;
    
    // Assign our mock to the global import function used by page-renderer
    // This is a bit of a hack for bun:test; in Jest, you'd use jest.mock.
    // @ts-ignore
    global.mockedImport = mockDynamicImport;
    // In page-renderer, you would change `await import(path)` to `await global.mockedImport(path)`
    // This requires editing the source file for this test setup to work directly.
    // Alternatively, if Bun supports it, use import.meta.resolve and mock that resolution.
    // For now, this illustrates the intent. The actual mocking of dynamic imports needs careful setup.
    // A common pattern is to use a spy on a service that does the importing.
  });

  afterEach(() => {
    mockDynamicImport.mockClear();
    (React.createElement as ReturnType<typeof mock>).mockClear();
    (ReactDOMServer.renderToString as ReturnType<typeof mock>).mockClear();
    // @ts-ignore
    global.mockedImport = undefined;
  });

  // Helper to simulate dynamic import within tests if global override is problematic
  const simulateImport = mockDynamicImport; 

  it('should render a page component correctly', async () => {
    const pageRoute: DiscoveredRoute = {
      path: '/test',
      filePath: 'app/pages/TestPage.tsx',
      type: 'page',
      name: 'TestPage',
      depth: 1,
      isDynamic: false,
    };
    
    // Temporarily override dynamic import for this test
    const originalImport = global.import;
    // @ts-ignore
    global.import = simulateImport;

    const response = await handleReactPageRoute(mockCtx as Context, pageRoute, mockConfig, mockReactExternals, mockLogger);
    
    expect(mockReactExternals.React.createElement).toHaveBeenCalled();
    expect(mockReactExternals.renderToString).toHaveBeenCalledWith('mocked_react_element');
    expect(response).toBe('mocked_html_output');
    // @ts-ignore
    global.import = originalImport; // Restore
  });

  it('should render a page with a layout component correctly', async () => {
    const pageRoute: DiscoveredRoute = {
      path: '/test-layout',
      filePath: 'app/pages/TestPageWithLayout.tsx',
      layout: 'app/layouts/MainLayout.tsx', // Path to layout
      type: 'page',
      name: 'TestPageWithLayout',
      depth: 1,
      isDynamic: false,
    };

    const originalImport = global.import;
    // @ts-ignore
    global.import = simulateImport;

    const response = await handleReactPageRoute(mockCtx as Context, pageRoute, mockConfig, mockReactExternals, mockLogger);

    expect(mockReactExternals.React.createElement).toHaveBeenCalledTimes(2); // Page + Layout
    expect(mockReactExternals.renderToString).toHaveBeenCalledWith('mocked_react_element'); // Inner element for layout
    expect(response).toBe('mocked_html_output');
    // @ts-ignore
    global.import = originalImport; // Restore
  });

  it('should return 500 if PageComponent is not a function', async () => {
    const pageRoute: DiscoveredRoute = {
      path: '/test-non-func',
      filePath: 'app/pages/NonFunctionPage.tsx',
      type: 'page',
      name: 'NonFunctionPage',
      depth: 1,
      isDynamic: false,
    };
    const originalImport = global.import;
    // @ts-ignore
    global.import = simulateImport;

    const response = await handleReactPageRoute(mockCtx as Context, pageRoute, mockConfig, mockReactExternals, mockLogger) as Response;
    
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toContain('Page component could not be loaded');
    // @ts-ignore
    global.import = originalImport; // Restore
  });

  it('should render page without layout if LayoutComponent is not a function', async () => {
    const pageRoute: DiscoveredRoute = {
      path: '/test-non-func-layout',
      filePath: 'app/pages/TestPage.tsx',
      layout: 'app/layouts/NonFunctionLayout.tsx',
      type: 'page',
      name: 'TestPageWithNonFuncLayout',
      depth: 1,
      isDynamic: false,
    };
    const originalImport = global.import;
    // @ts-ignore
    global.import = simulateImport;

    const response = await handleReactPageRoute(mockCtx as Context, pageRoute, mockConfig, mockReactExternals, mockLogger);

    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Layout component not found or not a function'));
    expect(mockReactExternals.React.createElement).toHaveBeenCalledTimes(1); // Only PageComponent
    expect(mockReactExternals.renderToString).toHaveBeenCalledWith('mocked_react_element');
    expect(response).toBe('mocked_html_output');
    // @ts-ignore
    global.import = originalImport; // Restore
  });

  it('should return 500 if ReactExternals are incomplete', async () => {
    const pageRoute: DiscoveredRoute = {
      path: '/test',
      filePath: 'app/pages/TestPage.tsx',
      type: 'page',
      name: 'TestPage',
      depth: 1,
      isDynamic: false,
    };
    const incompleteExternals = { React: undefined, renderToString: undefined } as unknown as ReactExternals;
    const originalImport = global.import;
    // @ts-ignore
    global.import = simulateImport;

    const response = await handleReactPageRoute(mockCtx as Context, pageRoute, mockConfig, incompleteExternals, mockLogger) as Response;

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toContain('React externals not available');
    // @ts-ignore
    global.import = originalImport; // Restore
  });

  it('should handle errors during rendering', async () => {
    const pageRoute: DiscoveredRoute = {
      path: '/test-err',
      filePath: 'app/pages/ErrorPage.tsx',
      type: 'page',
      name: 'ErrorPage',
      depth: 1,
      isDynamic: false,
    };
    (ReactDOMServer.renderToString as ReturnType<typeof mock>).mockImplementationOnce(() => { throw new Error('Render kaboom!'); });
    const originalImport = global.import;
    // @ts-ignore
    global.import = simulateImport;

    const response = await handleReactPageRoute(mockCtx as Context, pageRoute, mockConfig, mockReactExternals, mockLogger) as Response;

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toContain('Error During Page Rendering');
    expect(text).toContain('Render kaboom!');
    // @ts-ignore
    global.import = originalImport; // Restore
  });
}); 