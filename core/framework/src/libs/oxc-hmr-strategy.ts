import { createLogger } from './logger';
import { ReactComponentAnalyzer } from './reactAnalyzer';
import { createOxcTransformer, type OxcTransformResult } from './oxc-transformer';
import { createBuildPipeline, type BuildPipeline } from './build-pipeline';
import type { HMRUpdateStrategy, ReactComponentInfo } from '../types/hmr';
import { extname, relative, basename, join, dirname } from 'path';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';

const logger = createLogger('hmr:oxc-strategy');

export interface OxcHMRConfig {
  /** Directory being watched */
  watchDir: string;
  /** Output directory for transformed files */
  outputDir?: string;
  /** Whether to enable OXC transformation */
  enableOxc?: boolean;
  /** OXC transformer options */
  oxcOptions?: {
    preserveJsx?: boolean;
    target?: 'es5' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'esnext';
    sourcemap?: boolean;
  };
}

export class OxcHMRUpdateStrategy implements HMRUpdateStrategy {
  private watchDir: string;
  private outputDir: string;
  private reactAnalyzer: ReactComponentAnalyzer;
  private oxcTransformer: ReturnType<typeof createOxcTransformer> | null = null;
  private buildPipeline: BuildPipeline | null = null;
  private enableOxc: boolean;
  private oxcOptions: OxcHMRConfig['oxcOptions'];
  private transformCache = new Map<string, { hash: string; result: OxcTransformResult }>();

  constructor(config: OxcHMRConfig) {
    this.watchDir = config.watchDir;
    this.outputDir = config.outputDir || join(config.watchDir, '.zephra', 'transformed');
    this.enableOxc = config.enableOxc ?? true;
    this.oxcOptions = config.oxcOptions || {};
    this.reactAnalyzer = new ReactComponentAnalyzer();

    if (this.enableOxc) {
      try {
        this.oxcTransformer = createOxcTransformer(undefined, logger);
        this.buildPipeline = createBuildPipeline({
          srcDir: this.watchDir,
          outDir: this.outputDir,
          transformOptions: this.oxcOptions,
          logger: logger
        });
        
        // Ensure output directory exists
        if (!existsSync(this.outputDir)) {
          mkdirSync(this.outputDir, { recursive: true });
        }
        
        logger.info('[OXC-HMR] OXC transformer initialized successfully');
      } catch (error) {
        logger.warn('[OXC-HMR] Failed to initialize OXC transformer, falling back to standard HMR:', error);
        this.enableOxc = false;
      }
    }
  }

  canHotUpdate(filePath: string, fileType: string): boolean {
    switch (fileType) {
      case 'css':
        return true;
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
    const criticalFiles = [
      'layout.tsx', 'layout.jsx', 'app.tsx', 'app.jsx',
      '_app.tsx', '_app.jsx', 'page.tsx', 'page.jsx'
    ];

    const fileName = basename(filePath).toLowerCase();
    if (criticalFiles.includes(fileName)) {
      return true;
    }

    if (fileName.includes('config') || fileName.includes('.env')) {
      return true;
    }

    if (fileType === 'html') {
      return true;
    }

    return !this.canHotUpdate(filePath, fileType);
  }

  getModuleId(filePath: string): string {
    const relativePath = relative(this.watchDir, filePath);
    return relativePath.replace(/\\/g, '/');
  }

  getFileType(filePath: string): 'js' | 'ts' | 'jsx' | 'tsx' | 'css' | 'html' | 'other' {
    const ext = extname(filePath).toLowerCase();
    switch (ext) {
      case '.js': return 'js';
      case '.ts': return 'ts';
      case '.jsx': return 'jsx';
      case '.tsx': return 'tsx';
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

  /**
   * Transform a file using OXC if enabled and applicable
   */
  async transformFile(filePath: string): Promise<{ transformedPath: string; code: string } | null> {
    if (!this.enableOxc || !this.buildPipeline) {
      return null;
    }

    const fileType = this.getFileType(filePath);
    if (fileType !== 'ts' && fileType !== 'tsx' && fileType !== 'jsx') {
      return null;
    }

    try {
      // Check cache first
      const content = readFileSync(filePath, 'utf-8');
      const hash = this.hashContent(content);
      const cached = this.transformCache.get(filePath);
      
      if (cached && cached.hash === hash) {
        logger.debug(`[OXC-HMR] Using cached transformation for ${filePath}`);
        return {
          transformedPath: cached.result.outputPath,
          code: cached.result.code
        };
      }

      // Transform with OXC
      const result = await this.buildPipeline.transformSingleFile(filePath);
      if (!result) {
        return null;
      }

      // Cache the result
      this.transformCache.set(filePath, { hash, result });

      logger.debug(`[OXC-HMR] Transformed ${filePath} -> ${result.outputPath} in ${result.transformTime}ms`);
      
      return {
        transformedPath: result.outputPath,
        code: result.code
      };

    } catch (error) {
      logger.error(`[OXC-HMR] Failed to transform ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Get the transformed file path for a source file
   */
  getTransformedPath(filePath: string): string | null {
    if (!this.enableOxc) {
      return null;
    }

    const relativePath = relative(this.watchDir, filePath);
    const ext = extname(relativePath);
    const base = relativePath.slice(0, -ext.length);
    
    const outputExt = (ext === '.tsx' || ext === '.ts') ? '.js' : ext;
    return join(this.outputDir, `${base}${outputExt}`);
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

  getUpdateStrategy(filePath: string): { 
    type: 'hot' | 'reload' | 'fast-refresh'; 
    reason: string;
    transformedPath?: string;
  } {
    const fileType = this.getFileType(filePath);
    
    if (this.shouldReload(filePath, fileType)) {
      return {
        type: 'reload',
        reason: `Critical file or unsupported type: ${fileType}`
      };
    }

    // Get transformed path if OXC is enabled
    const transformedPath = this.getTransformedPath(filePath);

    // Check for React Fast Refresh first
    if ((fileType === 'jsx' || fileType === 'tsx') && this.canFastRefresh(filePath)) {
      return {
        type: 'fast-refresh',
        reason: `React Fast Refresh supported for ${fileType}${this.enableOxc ? ' (with OXC)' : ''}`,
        transformedPath: transformedPath || undefined
      };
    }

    if (this.canHotUpdate(filePath, fileType)) {
      return {
        type: 'hot',
        reason: `Hot update supported for ${fileType}${this.enableOxc ? ' (with OXC)' : ''}`,
        transformedPath: transformedPath || undefined
      };
    }

    return {
      type: 'reload',
      reason: `Fallback to reload for ${fileType}`
    };
  }

  /**
   * Clear transformation cache for a file
   */
  clearCache(filePath?: string): void {
    if (filePath) {
      this.transformCache.delete(filePath);
      logger.debug(`[OXC-HMR] Cleared cache for ${filePath}`);
    } else {
      this.transformCache.clear();
      logger.debug('[OXC-HMR] Cleared all transformation cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; files: string[] } {
    return {
      size: this.transformCache.size,
      files: Array.from(this.transformCache.keys())
    };
  }

  private isReactComponent(filePath: string): boolean {
    const fileName = basename(filePath);
    const isComponentFile = /^[A-Z][a-zA-Z0-9]*\.(tsx|jsx)$/.test(fileName);
    const isInComponentsDir = filePath.includes('/components/') || filePath.includes('\\components\\');
    return isComponentFile || isInComponentsDir;
  }

  private isUtilityModule(filePath: string): boolean {
    const fileName = basename(filePath).toLowerCase();
    const utilityPatterns = ['utils', 'helpers', 'constants', 'types', 'hooks', 'lib'];
    return utilityPatterns.some(pattern => 
      fileName.includes(pattern) || filePath.includes(`/${pattern}/`) || filePath.includes(`\\${pattern}\\`)
    );
  }

  private hashContent(content: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
} 