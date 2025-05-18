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

interface FileTreeNode {
  [key: string]: FileTreeNode | string;
}

function buildFileTree(dir: string, baseDir: string): FileTreeNode {
  const fs = require('node:fs');
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const tree: FileTreeNode = {};
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      tree[entry.name] = buildFileTree(fullPath, baseDir);
    } else {
      tree[entry.name] = relPath;
    }
  }
  return tree;
}

interface ScanDiagnostics {
  apiRoutes: DiscoveredRoute[];
  pageRoutes: DiscoveredRoute[];
  layouts: { [dir: string]: string };
  duplicateApiWarnings: string[];
  duplicatePageWarnings: string[];
  errors: string[];
  fileTree: {
    apiDir: FileTreeNode;
    pagesDir: FileTreeNode;
  };
}

export async function scanRoutes(config: RouteScannerConfig): Promise<ScanDiagnostics> {
  const discoveredRoutes: DiscoveredRoute[] = [];
  const { appDir, apiDir: relativeApiDir, pagesDir: relativePagesDir } = config;
  const errors: string[] = [];
  const duplicateApiWarnings: string[] = [];
  const duplicatePageWarnings: string[] = [];
  const layouts: { [dir: string]: string } = {};

  const absoluteAppDir = path.resolve(appDir);
  const absoluteApiDir = normalizePath(path.join(absoluteAppDir, relativeApiDir));
  const absolutePagesDir = relativePagesDir ? normalizePath(path.join(absoluteAppDir, relativePagesDir)) : '';

  // --- Scan for API Routes (enforce route.ts pattern) ---
  const apiGlobPattern = normalizePath(path.join(absoluteApiDir, `**/route{${VALID_API_EXTENSIONS.join(',')}}`));
  const apiGlob = new Glob(apiGlobPattern);
  const apiRouteDirectories = new Set<string>();
  for await (const absoluteFilePath of apiGlob.scan({ absolute: true, dot: true, cwd: absoluteAppDir })) {
    const normalizedFilePath = normalizePath(absoluteFilePath);
    const fileDirPath = path.dirname(normalizedFilePath);
    if (apiRouteDirectories.has(fileDirPath)) {
      duplicateApiWarnings.push(fileDirPath);
      continue;
    }
    apiRouteDirectories.add(fileDirPath);
    const relativeFileDirPath = normalizePath(fileDirPath).replace(absoluteApiDir, '');
    const fileName = path.basename(normalizedFilePath);
    const ext = path.extname(fileName);
    const baseNameWithoutExt = fileName.substring(0, fileName.length - ext.length);
    const httpMethod: HttpMethod | undefined = undefined;
    const segments = relativeFileDirPath.split('/').filter(Boolean);
    const transformedSegments = segments.map(transformSegment);
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
  }
  // --- Scan for Page Routes (enforce page.tsx pattern) ---
  const pageDirectories = new Set<string>();
  if (relativePagesDir) {
    const pageGlobPattern = normalizePath(path.join(absoluteAppDir, "**/page{.tsx,.jsx,.ts,.js}"));
    const duplicatePageWarningsSet = new Set<string>();
    const pageGlob = new Glob(pageGlobPattern);
    for await (const absoluteFilePath of pageGlob.scan({ absolute: true, dot: true, cwd: absoluteAppDir })) {
      const normalizedFilePath = normalizePath(absoluteFilePath);
      if (normalizedFilePath.startsWith(absoluteApiDir)) {
        continue;
      }
      const fileDirPath = path.dirname(normalizedFilePath);
      if (pageDirectories.has(fileDirPath)) {
        if (!duplicatePageWarningsSet.has(fileDirPath)) {
          duplicatePageWarnings.push(fileDirPath);
          duplicatePageWarningsSet.add(fileDirPath);
        }
        continue;
      }
      pageDirectories.add(fileDirPath);
      let relativePath = '';
      if (fileDirPath.startsWith(absolutePagesDir)) {
        relativePath = fileDirPath.substring(absolutePagesDir.length);
      } else {
        relativePath = fileDirPath.substring(absoluteAppDir.length);
        if (relativePath.startsWith(`/${relativePagesDir}`)) {
          relativePath = relativePath.substring(relativePagesDir.length + 1);
        }
      }
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
      }
      const segments = relativePath.split('/').filter(Boolean);
      const transformedSegments = segments.map(transformSegment);
      const routePath = transformedSegments.length > 0 
        ? `/${transformedSegments.join('/')}` 
        : '/';
      discoveredRoutes.push({
        filePath: normalizedFilePath,
        path: routePath,
        type: 'page',
        name: relativePath,
        depth: routePath.split('/').filter(Boolean).length,
        isDynamic: /[:*?]/.test(routePath),
      });
    }
  }
  // --- Scan for Layout Files ---
  if (relativePagesDir) {
    const layoutGlobPattern = normalizePath(path.join(absoluteAppDir, `**/{layout,layout.}{${VALID_LAYOUT_EXTENSIONS.join(',')}}`));
    const layoutGlob = new Glob(layoutGlobPattern);
    for await (const absoluteFilePath of layoutGlob.scan({ absolute: true, dot: true, cwd: absoluteAppDir })) {
      const normalizedFilePath = normalizePath(absoluteFilePath);
      if (normalizedFilePath.startsWith(absoluteApiDir)) {
        continue;
      }
      const fileDirPath = path.dirname(normalizedFilePath);
      layouts[fileDirPath] = normalizedFilePath;
    }
    for (const route of discoveredRoutes) {
      if (route.type === 'page') {
        const pageDir = path.dirname(route.filePath);
        let currentDir = pageDir;
        let layoutFile: string | null = null;
        const rootDir = normalizePath(path.join(absoluteAppDir, relativePagesDir));
        while (currentDir.startsWith(rootDir)) {
          if (layouts[currentDir]) {
            layoutFile = layouts[currentDir];
            break;
          }
          currentDir = path.dirname(currentDir);
        }
        if (layoutFile) {
          (route as PageRouteWithLayout).layout = layoutFile;
        }
      }
    }
  }
  // --- File Tree ---
  const fileTree: { apiDir: FileTreeNode; pagesDir: FileTreeNode } = { apiDir: {}, pagesDir: {} };
  try {
    fileTree.apiDir = buildFileTree(absoluteApiDir, absoluteAppDir);
  } catch (e) {
    errors.push(`Failed to build API file tree: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (relativePagesDir) {
    try {
      fileTree.pagesDir = buildFileTree(absolutePagesDir, absoluteAppDir);
    } catch (e) {
      errors.push(`Failed to build pages file tree: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  // --- Return diagnostics ---
  return {
    apiRoutes: discoveredRoutes.filter(r => r.type === 'api'),
    pageRoutes: discoveredRoutes.filter(r => r.type === 'page'),
    layouts,
    duplicateApiWarnings,
    duplicatePageWarnings,
    errors,
    fileTree
  };
} 