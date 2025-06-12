import { createLogger } from './logger';
import type { FileHashCache } from '../types/hmr';

const logger = createLogger('hmr:hash');

export class HashService {
  private cache: FileHashCache = {};

  async getFileHash(filePath: string): Promise<string> {
    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();
      
      if (!exists) {
        delete this.cache[filePath];
        return '';
      }

      const stats = await file.stat();
      const lastModified = new Date(stats.mtime);
      
      // Check cache first
      const cached = this.cache[filePath];
      if (cached && cached.lastModified.getTime() === lastModified.getTime()) {
        return cached.hash;
      }

      // Generate new hash
      const contents = await file.text();
      const hash = Bun.hash(contents).toString();
      
      // Update cache
      this.cache[filePath] = {
        hash,
        lastModified
      };

      logger.debug(`Generated hash for ${filePath}: ${hash}`);
      return hash;
    } catch (error) {
      logger.error(`Failed to hash file ${filePath}:`, error);
      return '';
    }
  }

  clearCache(filePath?: string): void {
    if (filePath) {
      delete this.cache[filePath];
      logger.debug(`Cleared cache for ${filePath}`);
    } else {
      this.cache = {};
      logger.debug('Cleared entire hash cache');
    }
  }

  getCacheStats(): { totalFiles: number; cacheSize: number } {
    const totalFiles = Object.keys(this.cache).length;
    const cacheSize = JSON.stringify(this.cache).length;
    return { totalFiles, cacheSize };
  }
} 