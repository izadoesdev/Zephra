export interface HMRConfig {
  port: number;
  wsPath: string;
  watchDir: string;
  clientPath: string;
  excludePatterns?: string[];
  debounceMs?: number;
  reactFastRefresh?: boolean;
}

export interface HMRClient {
  id: string;
  socket: WebSocket;
  connectedAt: Date;
}

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink';
  filename: string;
  fullPath: string;
  hash: string;
  timestamp: Date;
  fileType?: 'js' | 'ts' | 'jsx' | 'tsx' | 'css' | 'html' | 'other';
}

export interface HMRMessage {
  type: 'update' | 'reload' | 'error' | 'connected' | 'css-update' | 'js-update' | 'react-refresh';
  file?: string;
  hash?: string;
  message?: string;
  timestamp: Date;
  moduleId?: string;
  updateType?: 'hot' | 'reload' | 'fast-refresh';
  cssContent?: string;
  componentCode?: string;
  componentName?: string;
  preserveState?: boolean;
}

export interface HMRStats {
  connectedClients: number;
  totalUpdates: number;
  lastUpdate?: Date;
  watchedFiles: number;
}

export interface FileHashCache {
  [filePath: string]: {
    hash: string;
    lastModified: Date;
  };
}

export interface ModuleRegistry {
  [moduleId: string]: {
    hash: string;
    dependencies: string[];
    acceptsHMR: boolean;
    lastUpdate: Date;
    isReactComponent?: boolean;
    componentName?: string;
    hasState?: boolean;
  };
}

export interface ReactComponentInfo {
  name: string;
  filePath: string;
  hasHooks: boolean;
  hasState: boolean;
  isClassComponent: boolean;
  isFunctionComponent: boolean;
  dependencies: string[];
}

export interface HMRUpdateStrategy {
  canHotUpdate(filePath: string, fileType: string): boolean;
  shouldReload(filePath: string, fileType: string): boolean;
  getModuleId(filePath: string): string;
  canFastRefresh(filePath: string): boolean;
  analyzeReactComponent(filePath: string, content: string): ReactComponentInfo | null;
}

export interface HMRServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  getStats(): HMRStats;
  broadcastUpdate(event: FileChangeEvent): void;
  addClient(client: HMRClient): void;
  removeClient(clientId: string): void;
} 