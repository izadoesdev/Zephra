import { Glob } from 'bun';
import path from 'node:path';
import type { DiscoveredRoute, RouteScannerConfig, HttpMethod } from '../types/routing';
import { logger } from '../libs/logger';

const VALID_API_EXTENSIONS = ['.ts', '.js'];
const VALID_PAGE_EXTENSIONS = ['.tsx', '.jsx'];
const VALID_LAYOUT_EXTENSIONS = ['.tsx', '.jsx'];
const HTTP_METHODS_LOWER: ReadonlyArray<string> = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
const INDEX_FILE_NAMES_NO_EXT = ['index', 'route'];

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Transforms a file path part into a route segment.
 * Handles:
 * - Dynamic segments: [param] -> :param
 * - Catch-all segments: [...param] -> :param*
 * - Optional catch-all segments: [[...param]] -> :param* (base path also matched by router later)
 * - Optional segments: [[param]] -> :param?
 */
function transformSegment(segment: string): string {
  return segment
    .replace(/\[\[\.\.\.([^\]]+)\]\]/g, ':$1*') // [[...param]] -> :param*
    .replace(/\[\.\.\.([^\]]+)\]/g, ':$1*')     // [...param] -> :param*
    .replace(/\[\[([^\]]+)\]\]/g, ':$1?')       // [[param]] -> :param?
    .replace(/\[([^\]]+)\]/g, ':$1');          // [param] -> :param
}

// Before the scanRoutes function, add interface for page route with layout
interface PageRouteWithLayout extends DiscoveredRoute {
  layout?: string;
}

export async function scanRoutes(config: RouteScannerConfig): Promise<DiscoveredRoute[]> {
  const discoveredRoutes: DiscoveredRoute[] = [];
  const { appDir, apiDir: relativeApiDir, pagesDir: relativePagesDir } = config;

  const absoluteAppDir = path.resolve(appDir);
  const absoluteApiDir = normalizePath(path.join(absoluteAppDir, relativeApiDir));

  logger.info(`Scanning for routes in app directory: ${absoluteAppDir}`);
  logger.debug(`API base directory: ${absoluteApiDir}`);

  // --- Scan for API Routes (enforce route.ts pattern) ---
  const apiGlobPattern = normalizePath(path.join(absoluteApiDir, `**/route{${VALID_API_EXTENSIONS.join(',')}}`));
  logger.debug(`API glob pattern: ${apiGlobPattern}`);

  const apiGlob = new Glob(apiGlobPattern);
  
  // Track directories that already have a route to avoid duplicates
  const apiRouteDirectories = new Set<string>();
  const duplicateApiWarnings = new Set<string>();
  
  for await (const absoluteFilePath of apiGlob.scan({ absolute: true, dot: true, cwd: absoluteAppDir })) {
    const normalizedFilePath = normalizePath(absoluteFilePath);
    const fileDirPath = path.dirname(normalizedFilePath);
    
    // Check if we already found a route in this directory
    if (apiRouteDirectories.has(fileDirPath)) {
      if (!duplicateApiWarnings.has(fileDirPath)) {
        logger.warn(`Multiple route files found in ${fileDirPath}. Only the first one will be used.`);
        duplicateApiWarnings.add(fileDirPath);
      }
      continue;
    }
    
    // Mark this directory as having a route
    apiRouteDirectories.add(fileDirPath);
    
    // Get the relative path from the API base directory
    const relativeFileDirPath = normalizePath(fileDirPath).replace(absoluteApiDir, '');

    const fileName = path.basename(normalizedFilePath);
    const ext = path.extname(fileName);
    const baseNameWithoutExt = fileName.substring(0, fileName.length - ext.length);

    const httpMethod: HttpMethod | undefined = undefined;
    
    // Extract HTTP method from the source code if possible (not from filename)
    // For now, we'll only use the route.ts convention without method extraction from filename
    
    // Build the route path based on the directory structure
    const segments = relativeFileDirPath.split('/').filter(Boolean);
    const transformedSegments = segments.map(transformSegment);
    
    // Construct the final API route path
    // Add trailing slash for root API
    const apiRoutePath = transformedSegments.length > 0 
      ? `/api/${transformedSegments.join('/')}` 
      : '/api/';
    
    discoveredRoutes.push({
      filePath: normalizedFilePath,
      path: apiRoutePath,
      type: 'api',
      method: httpMethod,
      name: baseNameWithoutExt,
      depth: apiRoutePath.split('/').filter(Boolean).length,
      isDynamic: /[:*?]/.test(apiRoutePath),
    });
    logger.debug(`Discovered API: ${httpMethod ? String(httpMethod).toUpperCase() : 'ALL'} ${apiRoutePath} -> ${normalizedFilePath}`);
  }
  
  // --- Scan for Page Routes (enforce page.tsx pattern) ---
  if (relativePagesDir) {
    const absolutePagesDir = normalizePath(path.join(absoluteAppDir, relativePagesDir));
    logger.debug(`Pages base directory: ${absolutePagesDir}`);
    
    // For pages, we look specifically for files named exactly "page.tsx" or "page.jsx", etc.
    const pageGlobPattern = normalizePath(path.join(absoluteAppDir, "**/page{.tsx,.jsx,.ts,.js}"));
    logger.debug(`Page glob pattern: ${pageGlobPattern}`);
    
    // Track directories that already have a page to avoid duplicates
    const pageDirectories = new Set<string>();
    const duplicatePageWarnings = new Set<string>();
    
    const pageGlob = new Glob(pageGlobPattern);
    for await (const absoluteFilePath of pageGlob.scan({ absolute: true, dot: true, cwd: absoluteAppDir })) {
      const normalizedFilePath = normalizePath(absoluteFilePath);
      
      // Skip if file is in the API directory
      if (normalizedFilePath.startsWith(absoluteApiDir)) {
        continue;
      }
      
      const fileDirPath = path.dirname(normalizedFilePath);
      
      // Check if we already found a page in this directory
      if (pageDirectories.has(fileDirPath)) {
        if (!duplicatePageWarnings.has(fileDirPath)) {
          logger.warn(`Multiple page files found in ${fileDirPath}. Only the first one will be used.`);
          duplicatePageWarnings.add(fileDirPath);
        }
        continue;
      }
      
      // Mark this directory as having a page
      pageDirectories.add(fileDirPath);
      
      // Get the route path by analyzing the directory structure
      // Extract the path from the directory structure, transforming [param] to :param
      
      // Parse the directory path relative to the pages directory to get the route path
      let relativePath = '';
      
      // Check if the file is in the pages directory or any subdirectory
      if (fileDirPath.startsWith(absolutePagesDir)) {
        relativePath = fileDirPath.substring(absolutePagesDir.length);
      } else {
        // If it's in another directory, use the appDir as the base
        relativePath = fileDirPath.substring(absoluteAppDir.length);
        
        // Remove the relativePagesDir from the beginning if it exists
        if (relativePath.startsWith(`/${relativePagesDir}`)) {
          relativePath = relativePath.substring(relativePagesDir.length + 1);
        }
      }
      
      // Clean up the path
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
      }
      
      // Split the path into segments and transform each segment to handle dynamic parts
      const segments = relativePath.split('/').filter(Boolean);
      const transformedSegments = segments.map(transformSegment);
      
      // Build the final path
      const routePath = transformedSegments.length > 0 
        ? `/${transformedSegments.join('/')}` 
        : '/';
      
      logger.debug(`Directory parsing: fileDirPath=${fileDirPath}, absolutePagesDir=${absolutePagesDir}, relativePath=${relativePath}, routePath=${routePath}`);
      
      // The file name (page.tsx) itself doesn't contribute to the path
      discoveredRoutes.push({
        filePath: normalizedFilePath,
        path: routePath,
        type: 'page',
        name: relativePath,
        depth: routePath.split('/').filter(Boolean).length,
        isDynamic: /[:*?]/.test(routePath),
      });
      
      logger.debug(`Discovered page: ${routePath} -> ${normalizedFilePath}`);
    }
  }
  
  // --- Scan for Layout Files ---
  if (relativePagesDir) {
    const layoutGlobPattern = normalizePath(path.join(absoluteAppDir, `**/{layout,layout.}{${VALID_LAYOUT_EXTENSIONS.join(',')}}`));
    logger.debug(`Layout glob pattern: ${layoutGlobPattern}`);
    
    // Map to store layouts by directory path
    const layoutsByDir = new Map<string, string>();
    
    const layoutGlob = new Glob(layoutGlobPattern);
    for await (const absoluteFilePath of layoutGlob.scan({ absolute: true, dot: true, cwd: absoluteAppDir })) {
      const normalizedFilePath = normalizePath(absoluteFilePath);
      
      // Skip if file is in the API directory
      if (normalizedFilePath.startsWith(absoluteApiDir)) {
        continue;
      }
      
      const fileDirPath = path.dirname(normalizedFilePath);
      
      // Store the layout file path for this directory
      layoutsByDir.set(fileDirPath, normalizedFilePath);
      logger.debug(`Discovered layout in directory: ${fileDirPath} -> ${normalizedFilePath}`);
    }
    
    // Attach layout information to page routes
    for (const route of discoveredRoutes) {
      if (route.type === 'page') {
        const pageDir = path.dirname(route.filePath);
        
        // Check for layout in the current directory or any parent directory
        let currentDir = pageDir;
        let layoutFile: string | null = null;
        const rootDir = normalizePath(path.join(absoluteAppDir, relativePagesDir));
        
        while (currentDir.startsWith(rootDir)) {
          if (layoutsByDir.has(currentDir)) {
            const layout = layoutsByDir.get(currentDir);
            if (layout) {
              layoutFile = layout;
              break;
            }
          }
          
          // Move up a directory
          currentDir = path.dirname(currentDir);
        }
        
        if (layoutFile) {
          // Add layout information to the page route
          (route as PageRouteWithLayout).layout = layoutFile;
          logger.debug(`Assigned layout ${layoutFile} to page ${route.path}`);
        }
      }
    }
  }
  
  // Sort routes: shorter paths first, then by path string
  discoveredRoutes.sort((a, b) => {
    if (a.path.length !== b.path.length) {
      return a.path.length - b.path.length;
    }
    return a.path.localeCompare(b.path);
  });

  return discoveredRoutes;
} 