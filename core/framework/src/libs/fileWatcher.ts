import { watch } from 'fs';
import { join, relative } from 'path';
import { createLogger } from './logger';
import { HashService } from './hashService';
import { HMRUpdateStrategyImpl } from './hmrStrategy';
import type { FileChangeEvent, HMRConfig } from '../types/hmr';

const logger = createLogger('hmr:watcher');

export class FileWatcher {
  private hashService: HashService;
  private strategy: HMRUpdateStrategyImpl;
  private watchers: Map<string, any> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Set<(event: FileChangeEvent) => void> = new Set();
  private config: Pick<HMRConfig, 'watchDir' | 'excludePatterns' | 'debounceMs'>;

  constructor(config: Pick<HMRConfig, 'watchDir' | 'excludePatterns' | 'debounceMs'>) {
    this.config = {
      debounceMs: 100,
      excludePatterns: ['node_modules', '.git', 'dist', 'build'],
      ...config
    };
    this.hashService = new HashService();
    this.strategy = new HMRUpdateStrategyImpl(this.config.watchDir);
  }

  start(): void {
    logger.info(`Starting file watcher for directory: ${this.config.watchDir}`);
    
    const watcher = watch(
      this.config.watchDir,
      { recursive: true },
      (eventType, filename) => {
        if (!filename) return;
        this.handleFileChange(eventType as 'rename' | 'change', filename);
      }
    );

    this.watchers.set(this.config.watchDir, watcher);
    logger.info('File watcher started successfully');
  }

  stop(): void {
    logger.info('Stopping file watcher...');
    
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Close all watchers
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();

    logger.info('File watcher stopped');
  }

  onFileChange(listener: (event: FileChangeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async handleFileChange(eventType: 'rename' | 'change', filename: string): Promise<void> {
    const fullPath = join(this.config.watchDir, filename);
    const relativePath = relative(this.config.watchDir, fullPath);

    // Skip excluded patterns
    if (this.shouldExclude(relativePath)) {
      return;
    }

    // Debounce rapid changes
    const existingTimer = this.debounceTimers.get(fullPath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      this.debounceTimers.delete(fullPath);
      await this.processFileChange(eventType, filename, fullPath);
    }, this.config.debounceMs);

    this.debounceTimers.set(fullPath, timer);
  }

  private async processFileChange(
    eventType: 'rename' | 'change',
    filename: string,
    fullPath: string
  ): Promise<void> {
    try {
      const hash = await this.hashService.getFileHash(fullPath);
      const changeType = hash === '' ? 'unlink' : (eventType === 'rename' ? 'add' : 'change');
      const fileType = this.strategy.getFileType(fullPath);

      const event: FileChangeEvent = {
        type: changeType,
        filename,
        fullPath,
        hash,
        timestamp: new Date(),
        fileType
      };

      logger.debug(`File ${changeType}: ${filename} (type: ${fileType}, hash: ${hash})`);

      // Notify all listeners
      for (const listener of this.listeners) {
        try {
          listener(event);
        } catch (error) {
          logger.error('Error in file change listener:', error);
        }
      }
    } catch (error) {
      logger.error(`Error processing file change for ${filename}:`, error);
    }
  }

  private shouldExclude(relativePath: string): boolean {
    if (!this.config.excludePatterns) return false;
    
    return this.config.excludePatterns.some(pattern => 
      relativePath.includes(pattern) || relativePath.startsWith(pattern)
    );
  }

  getStats(): { watchedDirectories: number; activeTimers: number } {
    return {
      watchedDirectories: this.watchers.size,
      activeTimers: this.debounceTimers.size
    };
  }
} 