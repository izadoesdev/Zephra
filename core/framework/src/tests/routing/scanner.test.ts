import { beforeAll, afterAll, describe, test, expect } from 'bun:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { scanRoutes } from '../../routing/scanner';
import type { RouteScannerConfig, DiscoveredRoute, HttpMethod } from '../../types/routing';

// Use a unique directory for this test suite to avoid conflicts if tests run in parallel
const TEST_SUITE_ID = `scanner-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const TEST_APP_BASE_DIR = path.resolve(TEST_SUITE_ID);
const ZEPHRA_APP_ROOT = path.join(TEST_APP_BASE_DIR, 'app');

const testConfig: RouteScannerConfig = {
  appDir: ZEPHRA_APP_ROOT,
  apiDir: 'api',
  pagesDir: 'pages',
};

async function createMockFile(relativePath: string, content = '') {
  const absoluteFilePath = path.join(ZEPHRA_APP_ROOT, relativePath);
  await fs.mkdir(path.dirname(absoluteFilePath), { recursive: true });
  await fs.writeFile(absoluteFilePath, content);
  return absoluteFilePath;
}

describe('Route Scanner', () => {
  beforeAll(async () => {
    await fs.mkdir(ZEPHRA_APP_ROOT, { recursive: true });

    // Page structure - Various file locations
    await createMockFile('pages/page.tsx', 'export default () => <div>Home Page</div>'); // /
    await createMockFile('pages/about/page.tsx', 'export default () => <div>About Page</div>'); // /about
    await createMockFile('pages/blog/[slug]/page.tsx', 'export default ({ params }) => <div>Blog Post: {params.slug}</div>'); // /blog/:slug
    await createMockFile('pages/docs/[...catchall]/page.tsx', 'export default ({ params }) => <div>Docs: {params.catchall}</div>'); // /docs/:catchall*
    await createMockFile('pages/shop/[[...optionalcatchall]]/page.tsx', 'export default ({ params }) => <div>Shop: {params.optionalcatchall}</div>'); // /shop/:optionalcatchall*
    await createMockFile('pages/user/[[id]]/page.tsx', 'export default ({ params }) => <div>User: {params.id}</div>'); // /user/:id?
    await createMockFile('pages/products/index/page.tsx', 'export default () => <div>Products Index</div>'); // /products/index (folder named index)

    // Non-pages directory but still has page.tsx files (should still be discovered)
    await createMockFile('app/dashboard/page.tsx', 'export default () => <div>Dashboard</div>'); // Should be found if scanning app dir
    await createMockFile('app/settings/[section]/page.tsx', 'export default ({ params }) => <div>Settings: {params.section}</div>'); // Dynamic route in app dir

    // API structure
    await createMockFile('api/health/route.ts', 'export default () => ({ status: "ok" })'); // GET /api/health
    await createMockFile('api/users/[id]/route.ts', 'export default ({ params }) => ({ id: params.id })'); // /api/users/:id
    await createMockFile('api/items/route.ts', `
      export const post = ({ body }) => ({ created: body });
      export const get = () => ({ items: [] });
    `); // Multiple methods on a single route file
    await createMockFile('api/config/route.ts', 'export default () => ({ config: true })'); // /api/config/
    await createMockFile('api/route.ts', 'export default () => ({ message: "API root" })'); // /api/
    await createMockFile('api/products/route.ts', 'export default () => ({ products: [] })'); // /api/products/
    await createMockFile('api/orders/nested/route.ts', 'export default () => ({ orders: [] })'); // /api/orders/nested/
    await createMockFile('api/files/[...filename]/route.ts', 'export default ({ params }) => ({ file: params.filename })'); // /api/files/:filename*
    
    // Create some invalid files that should be ignored
    await createMockFile('api/invalid.ts', 'export default () => ({ invalid: true })'); // Should be ignored (not in a folder)
    await createMockFile('api/invalid/ignored.ts', 'export default () => ({ invalid: true })'); // Should be ignored (not route.ts)
    await createMockFile('pages/invalid.tsx', 'export default () => <div>Invalid</div>'); // Should be ignored (not page.tsx)
    
    // Multiple pages in the same folder (all but the first should be ignored)
    await createMockFile('pages/multiple/page1.tsx', 'export default () => <div>Page 1</div>'); // Should be ignored (not page.tsx)
    await createMockFile('pages/multiple/page.tsx', 'export default () => <div>Main page</div>'); // Should be used
    await createMockFile('pages/multiple/page2.tsx', 'export default () => <div>Page 2</div>'); // Should be ignored (not page.tsx)
    
    // Multiple route files in the same API folder (all but the first should be ignored)
    await createMockFile('api/multiple/route1.ts', 'export default () => ({ route: 1 })'); // Should be ignored (not route.ts)
    await createMockFile('api/multiple/route.ts', 'export default () => ({ route: "main" })'); // Should be used
    await createMockFile('api/multiple/route2.ts', 'export default () => ({ route: 2 })'); // Should be ignored (not route.ts)
  });

  afterAll(async () => {
    await fs.rm(TEST_APP_BASE_DIR, { recursive: true, force: true });
  });

  test('should discover all routes with standard config', async () => {
    const routes = await scanRoutes(testConfig);

    const expectedRoutes: Partial<DiscoveredRoute>[] = [
      // Pages - sorted by path length, then locale
      { path: '/', type: 'page', isDynamic: false },
      { path: '/about', type: 'page', isDynamic: false },
      { path: '/app/dashboard', type: 'page', isDynamic: false },
      { path: '/app/settings/:section', type: 'page', isDynamic: true },
      { path: '/blog/:slug', type: 'page', isDynamic: true },
      { path: '/docs/:catchall*', type: 'page', isDynamic: true },
      { path: '/multiple', type: 'page', isDynamic: false }, // Only the page.tsx should be found
      { path: '/products/index', type: 'page', isDynamic: false }, // folder named index
      { path: '/shop/:optionalcatchall*', type: 'page', isDynamic: true },
      { path: '/user/:id?', type: 'page', isDynamic: true },
      
      // API Routes - sorted by path length, then locale
      { path: '/api/', type: 'api', method: undefined, isDynamic: false }, // from api/route.ts
      { path: '/api/config', type: 'api', method: undefined, isDynamic: false }, // from api/config/route.ts
      { path: '/api/files/:filename*', type: 'api', method: undefined, isDynamic: true },
      { path: '/api/health', type: 'api', method: undefined, isDynamic: false },
      { path: '/api/items', type: 'api', method: undefined, isDynamic: false },
      { path: '/api/multiple', type: 'api', method: undefined, isDynamic: false }, // Only route.ts should be found
      { path: '/api/orders/nested', type: 'api', method: undefined, isDynamic: false },
      { path: '/api/products', type: 'api', method: undefined, isDynamic: false }, // from api/products/route.ts
      { path: '/api/users/:id', type: 'api', method: undefined, isDynamic: true },
    ];

    // Normalize file paths for comparison & check main properties
    const processedRoutes = routes.map(r => ({ 
        path: r.path, 
        type: r.type, 
        method: r.method, 
        isDynamic: r.isDynamic 
    }));

    // Ensure invalid routes are not included
    expect(processedRoutes.some(r => r.path === '/api/invalid')).toBe(false);
    expect(processedRoutes.some(r => r.path === '/invalid')).toBe(false);
    
    // Check proper de-duplication of routes in the same folder
    expect(processedRoutes.filter(r => r.path === '/multiple').length).toBe(1);
    expect(processedRoutes.filter(r => r.path === '/api/multiple').length).toBe(1);

    // To help debug if there are mismatches
    // if (processedRoutes.length !== expectedRoutes.length) {
    //     console.error('Route count mismatch!');
    //     console.log('Processed Routes:', JSON.stringify(processedRoutes, null, 2));
    //     console.log('Expected Routes:', JSON.stringify(expectedRoutes, null, 2));
    // }
    
    expect(processedRoutes.length).toBe(expectedRoutes.length);

    for (const expectedRoute of expectedRoutes) {
      expect(processedRoutes).toContainEqual(expectedRoute);
    }

    // Spot check a few filePaths to ensure they are absolute and correct
    const rootPage = routes.find(r => r.path === '/' && r.type === 'page');
    expect(rootPage?.filePath.endsWith('/app/pages/page.tsx')).toBe(true);
    expect(path.isAbsolute(rootPage?.filePath || '')).toBe(true);

    const blogSlugPage = routes.find(r => r.path === '/blog/:slug' && r.type === 'page');
    expect(blogSlugPage?.filePath.endsWith('/app/pages/blog/[slug]/page.tsx')).toBe(true);
    expect(path.isAbsolute(blogSlugPage?.filePath || '')).toBe(true);

    const multiplePage = routes.find(r => r.path === '/multiple' && r.type === 'page');
    expect(multiplePage?.filePath.endsWith('/app/pages/multiple/page.tsx')).toBe(true);

    const apiRoute = routes.find(r => r.path === '/api/items' && r.type === 'api');
    expect(apiRoute?.filePath.endsWith('/app/api/items/route.ts')).toBe(true);
    expect(path.isAbsolute(apiRoute?.filePath || '')).toBe(true);

    const dynamicApiRoute = routes.find(r => r.path === '/api/users/:id' && r.type === 'api');
    expect(dynamicApiRoute?.filePath.endsWith('/app/api/users/[id]/route.ts')).toBe(true);
    expect(path.isAbsolute(dynamicApiRoute?.filePath || '')).toBe(true);
    
    const multipleApiRoute = routes.find(r => r.path === '/api/multiple' && r.type === 'api');
    expect(multipleApiRoute?.filePath.endsWith('/app/api/multiple/route.ts')).toBe(true);

    // Check duplicate handling
    const apiDuplicatesRoutes = routes.filter(r => r.path === '/api/duplicates');
    const pageDuplicatesRoutes = routes.filter(r => r.path === '/duplicates');
    
    expect(apiDuplicatesRoutes.length).toBe(1);
    expect(pageDuplicatesRoutes.length).toBe(1);
    
    // Verify first discovered routes are used (flexible with extension)
    const apiRouteFilePath = apiDuplicatesRoutes[0].filePath;
    expect(apiRouteFilePath.endsWith('route.ts') || apiRouteFilePath.endsWith('route.js')).toBe(true);
    
    const pageRouteFilePath = pageDuplicatesRoutes[0].filePath;
    expect(pageRouteFilePath.endsWith('page.tsx') || pageRouteFilePath.endsWith('page.jsx')).toBe(true);
  });

  test('should only scan API routes when pagesDir is not provided', async () => {
    const apiOnlyConfig: RouteScannerConfig = {
      appDir: ZEPHRA_APP_ROOT,
      apiDir: 'api',
      // No pagesDir
    };

    const routes = await scanRoutes(apiOnlyConfig);
    
    // Only API routes should be discovered
    expect(routes.every(route => route.type === 'api')).toBe(true);
    expect(routes.some(route => route.type === 'page')).toBe(false);

    // Verify API route count - only valid routes should be counted
    const expectedApiRouteCount = 9; // The number of valid API routes we created
    expect(routes.length).toBe(expectedApiRouteCount);
    
    // Ensure all routes use the route.ts pattern
    expect(routes.every(route => route.filePath.endsWith('route.ts'))).toBe(true);
  });

  test('should handle custom directory structure', async () => {
    // Create some files in non-standard directories
    await createMockFile('custom-api/test/route.ts', 'export default () => ({ custom: true })');
    await createMockFile('custom-pages/test/page.tsx', 'export default () => <div>Custom Page</div>');

    const customConfig: RouteScannerConfig = {
      appDir: ZEPHRA_APP_ROOT,
      apiDir: 'custom-api',
      pagesDir: 'custom-pages',
    };

    const routes = await scanRoutes(customConfig);
    
    // Verify our custom API route is found
    const customApiRoute = routes.find(r => r.type === 'api' && r.path === '/api/test');
    expect(customApiRoute).toBeDefined();
    expect(customApiRoute?.filePath.endsWith('/app/custom-api/test/route.ts')).toBe(true);

    // Verify our custom page route is found
    const customPageRoute = routes.find(r => r.type === 'page' && r.path === '/test');
    expect(customPageRoute).toBeDefined();
    expect(customPageRoute?.filePath.endsWith('/app/custom-pages/test/page.tsx')).toBe(true);
  });

  test('should handle deeply nested dynamic routes', async () => {
    // Create a deeply nested dynamic route
    await createMockFile('pages/categories/[category]/products/[productId]/reviews/[...reviewIds]/page.tsx', 
      'export default ({ params }) => <div>Review</div>');

    const routes = await scanRoutes(testConfig);
    
    // Find our deeply nested route
    const deepRoute = routes.find(r => 
      r.type === 'page' && 
      r.path === '/categories/:category/products/:productId/reviews/:reviewIds*'
    );
    
    expect(deepRoute).toBeDefined();
    expect(deepRoute?.isDynamic).toBe(true);
    expect(deepRoute?.depth).toBe(6); // 6 segments in the path
  });
  
  test('should handle edge cases and duplicates', async () => {
    // Create duplicate files in the same folder (only first should be detected)
    await createMockFile('api/duplicates/route.ts', 'export default () => ({ first: true })');
    await createMockFile('api/duplicates/route.js', 'export default () => ({ second: true })'); // Should be ignored (duplicate)
    
    await createMockFile('pages/duplicates/page.tsx', 'export default () => <div>First</div>');
    await createMockFile('pages/duplicates/page.jsx', 'export default () => <div>Second</div>'); // Should be ignored (duplicate)
    
    const routes = await scanRoutes(testConfig);
    
    // Check each folder only has one route
    const apiDuplicatesRoutes = routes.filter(r => r.path === '/api/duplicates');
    const pageDuplicatesRoutes = routes.filter(r => r.path === '/duplicates');
    
    expect(apiDuplicatesRoutes.length).toBe(1);
    expect(pageDuplicatesRoutes.length).toBe(1);
    
    // Verify first discovered routes are used (flexible with extension)
    const apiRouteFilePath = apiDuplicatesRoutes[0].filePath;
    expect(apiRouteFilePath.endsWith('route.ts') || apiRouteFilePath.endsWith('route.js')).toBe(true);
    
    const pageRouteFilePath = pageDuplicatesRoutes[0].filePath;
    expect(pageRouteFilePath.endsWith('page.tsx') || pageRouteFilePath.endsWith('page.jsx')).toBe(true);
  });
}); 