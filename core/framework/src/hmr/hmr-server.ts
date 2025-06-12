import { Elysia } from 'elysia';
import { createLogger } from '../libs/logger';
import { FileWatcher } from '../libs/fileWatcher';
import { WebSocketManager } from '../libs/wsManager';
import { HMRUpdateStrategyImpl } from '../libs/hmrStrategy';
import { ModuleRegistryManager } from '../libs/moduleRegistry';
import { generateHMRClientScript } from './hmr-client';
import type { HMRConfig, HMRServer, FileChangeEvent } from '../types/hmr';
import { readFileSync } from 'fs';

const logger = createLogger('hmr:server');

export class HMRServerImpl implements HMRServer {
  private config: HMRConfig;
  private fileWatcher: FileWatcher;
  public wsManager: WebSocketManager; // Make public for proxy access
  private strategy: HMRUpdateStrategyImpl;
  private moduleRegistry: ModuleRegistryManager;
  private elysiaApp?: Elysia;
  private isRunning = false;

  constructor(config: Partial<HMRConfig> = {}) {
    this.config = {
      port: 3001,
      wsPath: '/hmr',
      watchDir: process.cwd(),
      clientPath: '/hmr-client.js',
      excludePatterns: ['node_modules', '.git', 'dist', 'build', '.zephra'],
      debounceMs: 100,
      reactFastRefresh: true,
      ...config
    };

    this.fileWatcher = new FileWatcher({
      watchDir: this.config.watchDir,
      excludePatterns: this.config.excludePatterns,
      debounceMs: this.config.debounceMs
    });

    this.wsManager = new WebSocketManager();
    this.strategy = new HMRUpdateStrategyImpl(this.config.watchDir);
    this.moduleRegistry = new ModuleRegistryManager();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('HMR server is already running');
      return;
    }

    logger.info(`Starting HMR server on port ${this.config.port}...`);

    // Setup file change handler
    this.fileWatcher.onFileChange((event: FileChangeEvent) => {
      this.broadcastUpdate(event);
    });

    // Create Elysia app with WebSocket support
    this.elysiaApp = new Elysia({ name: 'hmr-server' })
             .ws(this.config.wsPath, {
         open: (ws) => {
           this.wsManager.addClient(ws.raw as unknown as WebSocket);
         },
        close: (ws) => {
          // Client cleanup is handled in WebSocketManager
        },
        message: (ws, message) => {
          logger.debug(`Received message from client: ${message}`);
        }
      })
      .get(this.config.clientPath, () => {
        return new Response(
          generateHMRClientScript(this.config.wsPath, this.config.port),
          {
            headers: {
              'Content-Type': 'application/javascript; charset=utf-8',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
              'X-Content-Type-Options': 'nosniff'
            }
          }
        );
      })
      .options(this.config.clientPath, () => {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      })
      .get('/hmr/stats', () => {
        return this.getStats();
      })
      .listen(this.config.port);

    // Start file watching
    this.fileWatcher.start();
    this.isRunning = true;

    logger.info(`HMR server started successfully`);
    logger.info(`- WebSocket endpoint: ws://localhost:${this.config.port}${this.config.wsPath}`);
    logger.info(`- Client script: http://localhost:${this.config.port}${this.config.clientPath}`);
    logger.info(`- Watching directory: ${this.config.watchDir}`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('HMR server is not running');
      return;
    }

    logger.info('Stopping HMR server...');

    // Stop file watcher
    this.fileWatcher.stop();

    // Close all WebSocket connections
    this.wsManager.closeAllConnections();

    // Stop Elysia server
    if (this.elysiaApp) {
      this.elysiaApp.stop();
      this.elysiaApp = undefined;
    }

    this.isRunning = false;
    logger.info('HMR server stopped');
  }

  getStats() {
    const wsStats = this.wsManager.getStats();
    const watcherStats = this.fileWatcher.getStats();
    const moduleStats = this.moduleRegistry.getStats();

    return {
      ...wsStats,
      ...moduleStats,
      watchedFiles: watcherStats.watchedDirectories,
      isRunning: this.isRunning,
      capabilities: {
        cssHotUpdate: true,
        jsHotUpdate: true,
        reactFastRefresh: this.config.reactFastRefresh,
        smartReloading: true
      },
      config: {
        port: this.config.port,
        wsPath: this.config.wsPath,
        watchDir: this.config.watchDir,
        clientPath: this.config.clientPath
      }
    };
  }

  broadcastUpdate(event: FileChangeEvent): void {
    const moduleId = this.strategy.getModuleId(event.fullPath);
    const fileType = event.fileType || 'other';
    const updateStrategy = this.strategy.getUpdateStrategy(event.fullPath);
    
    logger.info(`Broadcasting update for ${event.filename} (${event.type}, strategy: ${updateStrategy.type})`);
    
    // Register or update module in registry
    if (event.type !== 'unlink') {
      // Analyze React component if applicable
      let componentInfo;
      if (fileType === 'jsx' || fileType === 'tsx') {
        try {
          const content = readFileSync(event.fullPath, 'utf-8');
          const analysis = this.strategy.analyzeReactComponent(event.fullPath, content);
          if (analysis) {
            componentInfo = {
              name: analysis.name,
              hasState: analysis.hasState,
              isReactComponent: true
            };
          }
        } catch (error) {
          logger.error(`Failed to analyze React component ${event.fullPath}:`, error);
        }
      }
      
      this.moduleRegistry.registerModule(moduleId, event.hash, [], componentInfo);
    } else {
      this.moduleRegistry.clearModule(moduleId);
    }

    // Handle different update strategies
    if (updateStrategy.type === 'fast-refresh') {
      this.handleFastRefresh(event, moduleId);
    } else if (updateStrategy.type === 'hot') {
      this.handleHotUpdate(event, moduleId, fileType);
    } else {
      this.handleReloadUpdate(event, moduleId, updateStrategy.reason);
    }
  }

  private handleHotUpdate(event: FileChangeEvent, moduleId: string, fileType: string): void {
    if (fileType === 'css') {
      this.handleCSSUpdate(event, moduleId);
    } else if (['js', 'ts', 'jsx', 'tsx'].includes(fileType)) {
      this.handleJSUpdate(event, moduleId);
    } else {
      // Fallback to reload for unknown types
      this.handleReloadUpdate(event, moduleId, 'Unknown file type for hot update');
    }
  }

  private handleCSSUpdate(event: FileChangeEvent, moduleId: string): void {
    try {
      // Read the CSS content for hot injection
      const cssContent = readFileSync(event.fullPath, 'utf-8');
      
      this.wsManager.broadcast({
        type: 'css-update',
        file: event.filename,
        hash: event.hash,
        moduleId,
        updateType: 'hot',
        cssContent
      });
      
      logger.info(`Hot updated CSS: ${moduleId}`);
    } catch (error) {
      logger.error(`Failed to read CSS file for hot update: ${error}`);
      this.handleReloadUpdate(event, moduleId, 'Failed to read CSS content');
    }
  }

  private handleFastRefresh(event: FileChangeEvent, moduleId: string): void {
    try {
      const content = readFileSync(event.fullPath, 'utf-8');
      const componentInfo = this.strategy.analyzeReactComponent(event.fullPath, content);
      
      if (!componentInfo) {
        logger.warn(`Fast Refresh requested but component analysis failed for ${moduleId}`);
        this.handleReloadUpdate(event, moduleId, 'Component analysis failed');
        return;
      }

      this.wsManager.broadcast({
        type: 'react-refresh',
        file: event.filename,
        hash: event.hash,
        moduleId,
        updateType: 'fast-refresh',
        componentCode: content,
        componentName: componentInfo.name,
        preserveState: componentInfo.hasState,
        message: `Fast refresh for ${componentInfo.name}`
      });
      
      logger.info(`React Fast Refresh applied: ${componentInfo.name} (preserve state: ${componentInfo.hasState})`);
    } catch (error) {
      logger.error(`Failed to apply Fast Refresh for ${moduleId}:`, error);
      this.handleReloadUpdate(event, moduleId, 'Fast Refresh failed');
    }
  }

  private handleJSUpdate(event: FileChangeEvent, moduleId: string): void {
    // For non-React JS/TS files, do a smart reload
    const affectedModules = this.moduleRegistry.getAffectedModules(moduleId);
    
    this.wsManager.broadcast({
      type: 'js-update',
      file: event.filename,
      hash: event.hash,
      moduleId,
      updateType: 'hot',
      message: `Updated ${moduleId} and ${affectedModules.length} dependent modules`
    });
    
    logger.info(`Hot updated JS module: ${moduleId} (affects ${affectedModules.length} modules)`);
  }

  private handleReloadUpdate(event: FileChangeEvent, moduleId: string, reason: string): void {
    this.wsManager.broadcast({
      type: 'reload',
      file: event.filename,
      hash: event.hash,
      moduleId,
      updateType: 'reload',
      message: reason
    });
    
    logger.info(`Full reload triggered for ${moduleId}: ${reason}`);
  }

  addClient(client: any): void {
    // This method is for interface compatibility
    // Actual client management is handled by WebSocketManager
  }

  removeClient(clientId: string): void {
    this.wsManager.removeClient(clientId);
  }
}

// Legacy function for backward compatibility
export function startHMRServer(config: Partial<HMRConfig> = {}): HMRServerImpl {
  const server = new HMRServerImpl(config);
  
  // Auto-start in development mode
  if (process.env.NODE_ENV !== 'production') {
    server.start().catch((error) => {
      logger.error('Failed to start HMR server:', error);
    });
  }
  
  return server;
}