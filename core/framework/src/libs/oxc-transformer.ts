import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { logger } from './logger';
import type { Logger } from '../types/app';

export interface OxcTransformOptions {
  /** Input file path */
  input: string;
  /** Output file path (optional, defaults to input with .js extension) */
  output?: string;
  /** Whether to preserve JSX (default: false) */
  preserveJsx?: boolean;
  /** Target ES version (default: 'es2022') */
  target?: 'es5' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'esnext';
  /** Enable source maps (default: false) */
  sourcemap?: boolean;
  /** Custom logger instance */
  logger?: Logger;
}

export interface OxcTransformResult {
  /** Transformed code */
  code: string;
  /** Source map (if enabled) */
  map?: string;
  /** Input file path */
  inputPath: string;
  /** Output file path */
  outputPath: string;
  /** Transformation time in milliseconds */
  transformTime: number;
}

export interface OxcBinaryPaths {
  /** Path to oxc_transformer binary */
  transformer: string;
  /** Path to oxc binary (for other operations) */
  oxc?: string;
}

export class OxcTransformer {
  private binaryPaths: OxcBinaryPaths;
  private logger: Logger;

  constructor(binaryPaths: OxcBinaryPaths, customLogger?: Logger) {
    this.binaryPaths = binaryPaths;
    this.logger = customLogger || logger;
    
    // Validate binary exists
    if (!existsSync(this.binaryPaths.transformer)) {
      throw new Error(`OXC transformer binary not found at: ${this.binaryPaths.transformer}`);
    }
  }

  /**
   * Transform a single file using oxc_transformer
   */
  async transformFile(options: OxcTransformOptions): Promise<OxcTransformResult> {
    const startTime = Date.now();
    const { input, output, preserveJsx = false, target = 'es2022', sourcemap = false } = options;

    if (!existsSync(input)) {
      throw new Error(`Input file not found: ${input}`);
    }

    const outputPath = output || this.getDefaultOutputPath(input);
    
    try {
      // Build command arguments
      const args = [input];
      
      if (preserveJsx) args.push('--preserve-jsx');
      if (target !== 'es2022') args.push('--target', target);
      if (sourcemap) args.push('--sourcemap');

      this.logger.debug(`[OXC] Transforming: ${input} -> ${outputPath}`);
      this.logger.debug(`[OXC] Command: ${this.binaryPaths.transformer} ${args.join(' ')}`);

      // Execute transformation
      const result = execSync(`"${this.binaryPaths.transformer}" ${args.join(' ')}`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 30000 // 30 second timeout
      });

      // Write output to file
      const outputDir = dirname(outputPath);
      if (!existsSync(outputDir)) {
        const { mkdirSync } = await import('fs');
        mkdirSync(outputDir, { recursive: true });
      }

      writeFileSync(outputPath, result);

      const transformTime = Date.now() - startTime;
      this.logger.info(`[OXC] Transformed ${input} in ${transformTime}ms`);

      return {
        code: result,
        inputPath: input,
        outputPath,
        transformTime
      };

    } catch (error) {
      const transformTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[OXC] Transform failed for ${input} after ${transformTime}ms: ${errorMessage}`);
      throw new Error(`OXC transformation failed: ${errorMessage}`);
    }
  }

  /**
   * Transform multiple files in parallel
   */
  async transformFiles(files: string[], options: Omit<OxcTransformOptions, 'input'> = {}): Promise<OxcTransformResult[]> {
    this.logger.info(`[OXC] Transforming ${files.length} files...`);
    
    const promises = files.map(file => 
      this.transformFile({ ...options, input: file })
    );

    try {
      const results = await Promise.all(promises);
      const totalTime = results.reduce((sum, r) => sum + r.transformTime, 0);
      this.logger.info(`[OXC] Transformed ${files.length} files in ${totalTime}ms total`);
      return results;
    } catch (error) {
      this.logger.error(`[OXC] Batch transformation failed: ${error}`);
      throw error;
    }
  }

  /**
   * Transform code string directly (writes to temp file)
   */
  async transformCode(code: string, filename: string = 'temp.tsx', options: Omit<OxcTransformOptions, 'input'> = {}): Promise<string> {
    const tempDir = join(process.cwd(), '.zephra', 'temp');
    const { mkdirSync } = await import('fs');
    
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    const tempFile = join(tempDir, filename);
    writeFileSync(tempFile, code);

    try {
      const result = await this.transformFile({ ...options, input: tempFile });
      return result.code;
    } finally {
      // Cleanup temp file
      try {
        const { unlinkSync } = await import('fs');
        unlinkSync(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Check if oxc_transformer binary is available and working
   */
  async checkHealth(): Promise<boolean> {
    try {
      execSync(`"${this.binaryPaths.transformer}" --version`, { 
        encoding: 'utf8',
        timeout: 5000 
      });
      return true;
    } catch {
      return false;
    }
  }

  private getDefaultOutputPath(inputPath: string): string {
    const ext = extname(inputPath);
    const base = basename(inputPath, ext);
    const dir = dirname(inputPath);
    
    // Convert .tsx -> .js, .ts -> .js
    const outputExt = ext === '.tsx' || ext === '.ts' ? '.js' : ext;
    return join(dir, `${base}${outputExt}`);
  }
}

/**
 * Create an OxcTransformer instance with auto-detected binary paths
 */
export function createOxcTransformer(customPaths?: Partial<OxcBinaryPaths>, customLogger?: Logger): OxcTransformer {
  const defaultPaths: OxcBinaryPaths = {
    transformer: process.env.OXC_TRANSFORMER_PATH || 
                join(process.cwd(), 'target', 'release', 'oxc_transformer'),
    oxc: process.env.OXC_PATH || 
         join(process.cwd(), 'target', 'release', 'oxc')
  };

  const binaryPaths = { ...defaultPaths, ...customPaths };
  return new OxcTransformer(binaryPaths, customLogger);
}

/**
 * Utility function to transform a single file quickly
 */
export async function transformFile(filePath: string, options: Omit<OxcTransformOptions, 'input'> = {}): Promise<OxcTransformResult> {
  const transformer = createOxcTransformer();
  return transformer.transformFile({ ...options, input: filePath });
}

/**
 * Utility function to transform code string quickly
 */
export async function transformCode(code: string, filename?: string, options: Omit<OxcTransformOptions, 'input'> = {}): Promise<string> {
  const transformer = createOxcTransformer();
  return transformer.transformCode(code, filename, options);
} 