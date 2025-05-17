import type { RouteScannerConfig } from '../types/routing'; // Adjusted path

export const DEFAULT_CONFIG: RouteScannerConfig = {
  appDir: process.cwd(),
  apiDir: 'app/api',
  pagesDir: 'app',
  appName: 'ZephraApp',
  logPrefix: 'app'
}; 