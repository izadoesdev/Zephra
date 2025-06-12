import { createLogger } from './logger';
import { ReactComponentAnalyzer } from './reactAnalyzer';
import type { HMRUpdateStrategy, ReactComponentInfo } from '../types/hmr';
import { extname, relative, basename } from 'path';
import { readFileSync } from 'fs';

const logger = createLogger('hmr:strategy');

export class HMRUpdateStrategyImpl implements HMRUpdateStrategy {
  private watchDir: string;
  private reactAnalyzer: ReactComponentAnalyzer;

  constructor(watchDir: string) {
    this.watchDir = watchDir;
    this.reactAnalyzer = new ReactComponentAnalyzer();
  }

  canHotUpdate(filePath: string, fileType: string): boolean {
    switch (fileType) {
      case 'css':
        return true; // CSS can always be hot-updated
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return this.isReactComponent(filePath) || this.isUtilityModule(filePath);
      default:
        return false;
    }
  }

  shouldReload(filePath: string, fileType: string): boolean {
    // Force reload for these critical files
    const criticalFiles = [
      'layout.tsx',
      'layout.jsx',
      'app.tsx',
      'app.jsx',
      '_app.tsx',
      '_app.jsx',
      'page.tsx',
      'page.jsx'
    ];

    const fileName = basename(filePath).toLowerCase();
    if (criticalFiles.includes(fileName)) {
      return true;
    }

    // Force reload for config files
    if (fileName.includes('config') || fileName.includes('.env')) {
      return true;
    }

    // Force reload for HTML files
    if (fileType === 'html') {
      return true;
    }

    // If we can't hot update, we need to reload
    return !this.canHotUpdate(filePath, fileType);
  }

  getModuleId(filePath: string): string {
    // Create a consistent module ID based on relative path
    const relativePath = relative(this.watchDir, filePath);
    return relativePath.replace(/\\/g, '/'); // Normalize path separators
  }

  getFileType(filePath: string): 'js' | 'ts' | 'jsx' | 'tsx' | 'css' | 'html' | 'other' {
    const ext = extname(filePath).toLowerCase();
    switch (ext) {
      case '.js':
        return 'js';
      case '.ts':
        return 'ts';
      case '.jsx':
        return 'jsx';
      case '.tsx':
        return 'tsx';
      case '.css':
      case '.scss':
      case '.sass':
      case '.less':
        return 'css';
      case '.html':
      case '.htm':
        return 'html';
      default:
        return 'other';
    }
  }

  private isReactComponent(filePath: string): boolean {
    const fileName = basename(filePath);
    
    // Check if it's a React component by naming convention
    const isComponentFile = /^[A-Z][a-zA-Z0-9]*\.(tsx|jsx)$/.test(fileName);
    
    // Check if it's in a components directory
    const isInComponentsDir = filePath.includes('/components/') || filePath.includes('\\components\\');
    
    return isComponentFile || isInComponentsDir;
  }

  private isUtilityModule(filePath: string): boolean {
    const fileName = basename(filePath).toLowerCase();
    
    // Utility modules that can be safely hot-updated
    const utilityPatterns = [
      'utils',
      'helpers',
      'constants',
      'types',
      'hooks',
      'lib'
    ];

    return utilityPatterns.some(pattern => 
      fileName.includes(pattern) || filePath.includes(`/${pattern}/`) || filePath.includes(`\\${pattern}\\`)
    );
  }

  canFastRefresh(filePath: string): boolean {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const componentInfo = this.reactAnalyzer.analyzeComponent(filePath, content);
      
      if (!componentInfo) {
        return false;
      }
      
      return this.reactAnalyzer.canFastRefresh(componentInfo);
    } catch (error) {
      logger.error(`Error checking Fast Refresh capability for ${filePath}:`, error);
      return false;
    }
  }

  analyzeReactComponent(filePath: string, content: string): ReactComponentInfo | null {
    return this.reactAnalyzer.analyzeComponent(filePath, content);
  }

  getUpdateStrategy(filePath: string): { type: 'hot' | 'reload' | 'fast-refresh'; reason: string } {
    const fileType = this.getFileType(filePath);
    
    if (this.shouldReload(filePath, fileType)) {
      return {
        type: 'reload',
        reason: `Critical file or unsupported type: ${fileType}`
      };
    }

    // Check for React Fast Refresh first
    if ((fileType === 'jsx' || fileType === 'tsx') && this.canFastRefresh(filePath)) {
      return {
        type: 'fast-refresh',
        reason: `React Fast Refresh supported for ${fileType}`
      };
    }

    if (this.canHotUpdate(filePath, fileType)) {
      return {
        type: 'hot',
        reason: `Hot update supported for ${fileType}`
      };
    }

    return {
      type: 'reload',
      reason: `Fallback to reload for ${fileType}`
    };
  }
} 