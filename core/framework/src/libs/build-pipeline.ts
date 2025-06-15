import { join, relative, extname, dirname } from 'path';
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { createOxcTransformer, type OxcTransformOptions, type OxcTransformResult } from './oxc-transformer';
import { logger } from './logger';
import type { Logger } from '../types/app';

export interface BuildPipelineConfig {
  /** Source directory to watch and transform */
  srcDir: string;
  /** Output directory for transformed files */
  outDir: string;
  include?: string[];
  exclude?: string[];
  /** OXC transformer options */
  transformOptions?: Omit<OxcTransformOptions, 'input' | 'output'>;
  /** Whether to enable watch mode */
  watch?: boolean;
  /** Custom logger */
  logger?: Logger;
  /** Whether to clean output directory before build */
  clean?: boolean;
}

export interface BuildResult {
  /** Number of files processed */
  filesProcessed: number;
  /** Total build time in milliseconds */
  buildTime: number;
  /** List of transformed files */
  transformedFiles: OxcTransformResult[];
  /** Any errors that occurred */
  errors: Error[];
}

export class BuildPipeline {
  private config: Required<BuildPipelineConfig>;
  private transformer: ReturnType<typeof createOxcTransformer>;
  private logger: Logger;
  private isWatching = false;

  constructor(config: BuildPipelineConfig) {
    this.config = {
      include: ['**/*.{ts,tsx,js,jsx}'],
      exclude: ['node_modules/**', '**/*.d.ts', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      transformOptions: {},
      watch: false,
      logger: logger,
      clean: false,
      ...config
    };

    this.logger = this.config.logger;
    this.transformer = createOxcTransformer(undefined, this.logger);
  }

  /**
   * Run a full build of all matching files
   */
  async build(): Promise<BuildResult> {
    const startTime = Date.now();
    this.logger.info(`[BUILD] Starting build pipeline...`);

    try {
      // Clean output directory if requested
      if (this.config.clean && existsSync(this.config.outDir)) {
        await this.cleanOutputDir();
      }

      // Ensure output directory exists
      if (!existsSync(this.config.outDir)) {
        mkdirSync(this.config.outDir, { recursive: true });
      }

      // Find all files to transform
      const files = await this.findFiles();
      this.logger.info(`[BUILD] Found ${files.length} files to transform`);

      if (files.length === 0) {
        return {
          filesProcessed: 0,
          buildTime: Date.now() - startTime,
          transformedFiles: [],
          errors: []
        };
      }

      // Transform all files
      const transformedFiles: OxcTransformResult[] = [];
      const errors: Error[] = [];

      for (const file of files) {
        try {
          const outputPath = this.getOutputPath(file);
          const result = await this.transformer.transformFile({
            input: file,
            output: outputPath,
            ...this.config.transformOptions
          });
          transformedFiles.push(result);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          errors.push(err);
          this.logger.error(`[BUILD] Failed to transform ${file}: ${err.message}`);
        }
      }

      const buildTime = Date.now() - startTime;
      const successCount = transformedFiles.length;
      const errorCount = errors.length;

      if (errorCount > 0) {
        this.logger.warn(`[BUILD] Build completed with ${errorCount} errors in ${buildTime}ms`);
      } else {
        this.logger.info(`[BUILD] Build completed successfully: ${successCount} files in ${buildTime}ms`);
      }

      return {
        filesProcessed: files.length,
        buildTime,
        transformedFiles,
        errors
      };

    } catch (error) {
      const buildTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`[BUILD] Build failed after ${buildTime}ms: ${err.message}`);
      
      return {
        filesProcessed: 0,
        buildTime,
        transformedFiles: [],
        errors: [err]
      };
    }
  }

  /**
   * Transform a single file (used by HMR)
   */
  async transformSingleFile(filePath: string): Promise<OxcTransformResult | null> {
    try {
      if (!this.shouldTransformFile(filePath)) {
        return null;
      }

      const outputPath = this.getOutputPath(filePath);
      const result = await this.transformer.transformFile({
        input: filePath,
        output: outputPath,
        ...this.config.transformOptions
      });

      this.logger.debug(`[BUILD] Transformed single file: ${filePath} -> ${outputPath}`);
      return result;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`[BUILD] Failed to transform single file ${filePath}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Start watching for file changes (integrates with existing HMR)
   */
  async startWatch(): Promise<void> {
    if (this.isWatching) {
      this.logger.warn('[BUILD] Watch mode already active');
      return;
    }

    this.logger.info('[BUILD] Starting watch mode...');
    this.isWatching = true;

    // Initial build
    await this.build();

    // Note: This integrates with the existing file watcher in the HMR system
    // The actual file watching is handled by the HMR system, this just provides
    // the transformation capability when files change
  }

  /**
   * Stop watching for file changes
   */
  stopWatch(): void {
    if (!this.isWatching) {
      return;
    }

    this.logger.info('[BUILD] Stopping watch mode...');
    this.isWatching = false;
  }

  /**
   * Check if a file should be transformed based on include/exclude patterns
   */
  shouldTransformFile(filePath: string): boolean {
    const relativePath = relative(this.config.srcDir, filePath);
    
    // Check if file is in source directory
    if (relativePath.startsWith('..')) {
      return false;
    }

    // Check exclude patterns
    for (const pattern of this.config.exclude) {
      if (this.matchesPattern(relativePath, pattern)) {
        return false;
      }
    }

    // Check include patterns
    for (const pattern of this.config.include) {
      if (this.matchesPattern(relativePath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get the output path for a given input file
   */
  private getOutputPath(inputPath: string): string {
    const relativePath = relative(this.config.srcDir, inputPath);
    const ext = extname(relativePath);
    const base = relativePath.slice(0, -ext.length);
    
    // Convert .tsx -> .js, .ts -> .js
    const outputExt = (ext === '.tsx' || ext === '.ts') ? '.js' : ext;
    const outputPath = join(this.config.outDir, `${base}${outputExt}`);
    
    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    return outputPath;
  }

  /**
   * Find all files matching the include/exclude patterns
   */
  private async findFiles(): Promise<string[]> {
    const allFiles: string[] = [];
    
    const walkDir = (dir: string): void => {
      try {
        const entries = readdirSync(dir);
        
        for (const entry of entries) {
          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            walkDir(fullPath);
          } else if (stat.isFile()) {
            allFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    walkDir(this.config.srcDir);
    
    // Filter files based on include/exclude patterns
    return allFiles.filter(file => this.shouldTransformFile(file));
  }

  /**
   * Clean the output directory
   */
  private async cleanOutputDir(): Promise<void> {
    this.logger.info(`[BUILD] Cleaning output directory: ${this.config.outDir}`);
    
    try {
      const { rmSync } = await import('fs');
      rmSync(this.config.outDir, { recursive: true, force: true });
    } catch (error) {
      this.logger.warn(`[BUILD] Failed to clean output directory: ${error}`);
    }
  }

  /**
   * Simple pattern matching (supports basic glob patterns)
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }
}

/**
 * Create a build pipeline with default configuration
 */
export function createBuildPipeline(config: BuildPipelineConfig): BuildPipeline {
  return new BuildPipeline(config);
}

/**
 * Quick build utility for transforming a directory
 */
export async function buildDirectory(srcDir: string, outDir: string, options: Partial<BuildPipelineConfig> = {}): Promise<BuildResult> {
  const pipeline = createBuildPipeline({
    srcDir,
    outDir,
    ...options
  });
  
  return pipeline.build();
} 