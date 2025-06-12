import { createLogger } from './logger';
import type { ModuleRegistry } from '../types/hmr';

const logger = createLogger('hmr:registry');

export class ModuleRegistryManager {
  private registry: ModuleRegistry = {};
  private dependencyGraph: Map<string, Set<string>> = new Map();

  registerModule(
    moduleId: string, 
    hash: string, 
    dependencies: string[] = [], 
    componentInfo?: { name: string; hasState: boolean; isReactComponent: boolean }
  ): void {
    this.registry[moduleId] = {
      hash,
      dependencies,
      acceptsHMR: this.determineHMRSupport(moduleId),
      lastUpdate: new Date(),
      isReactComponent: componentInfo?.isReactComponent || false,
      componentName: componentInfo?.name,
      hasState: componentInfo?.hasState || false
    };

    // Update dependency graph
    this.updateDependencyGraph(moduleId, dependencies);
    
    logger.debug(`Registered module: ${moduleId} (hash: ${hash}, React: ${componentInfo?.isReactComponent})`);
  }

  updateModule(moduleId: string, newHash: string): boolean {
    const module = this.registry[moduleId];
    if (!module) {
      logger.warn(`Attempted to update unregistered module: ${moduleId}`);
      return false;
    }

    if (module.hash === newHash) {
      logger.debug(`Module ${moduleId} hash unchanged, skipping update`);
      return false;
    }

    module.hash = newHash;
    module.lastUpdate = new Date();
    
    logger.info(`Updated module: ${moduleId} (new hash: ${newHash})`);
    return true;
  }

  getModule(moduleId: string) {
    return this.registry[moduleId];
  }

  getAffectedModules(moduleId: string): string[] {
    const affected: Set<string> = new Set();
    
    // Find all modules that depend on this module
    this.findDependents(moduleId, affected);
    
    return Array.from(affected);
  }

  canHotUpdate(moduleId: string): boolean {
    const module = this.registry[moduleId];
    return module?.acceptsHMR ?? false;
  }

  getAllModules(): ModuleRegistry {
    return { ...this.registry };
  }

  clearModule(moduleId: string): void {
    delete this.registry[moduleId];
    this.dependencyGraph.delete(moduleId);
    
    // Remove from other modules' dependencies
    for (const [id, deps] of this.dependencyGraph) {
      deps.delete(moduleId);
    }
    
    logger.debug(`Cleared module: ${moduleId}`);
  }

  getStats(): { totalModules: number; hmrCapableModules: number } {
    const total = Object.keys(this.registry).length;
    const hmrCapable = Object.values(this.registry).filter(m => m.acceptsHMR).length;
    
    return {
      totalModules: total,
      hmrCapableModules: hmrCapable
    };
  }

  private determineHMRSupport(moduleId: string): boolean {
    // Determine if a module supports HMR based on its type and content
    const ext = moduleId.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return true; // CSS files always support HMR
      
      case 'jsx':
      case 'tsx':
        // React components typically support HMR
        return this.isReactComponent(moduleId);
      
      case 'js':
      case 'ts':
        // Utility modules can support HMR
        return this.isUtilityModule(moduleId);
      
      default:
        return false;
    }
  }

  private isReactComponent(moduleId: string): boolean {
    // Check if it's likely a React component
    const fileName = moduleId.split('/').pop() || '';
    return /^[A-Z][a-zA-Z0-9]*\.(tsx|jsx)$/.test(fileName) ||
           moduleId.includes('/components/') ||
           moduleId.includes('\\components\\');
  }

  private isUtilityModule(moduleId: string): boolean {
    const utilityPatterns = ['utils', 'helpers', 'constants', 'hooks', 'lib'];
    return utilityPatterns.some(pattern => moduleId.includes(pattern));
  }

  private updateDependencyGraph(moduleId: string, dependencies: string[]): void {
    this.dependencyGraph.set(moduleId, new Set(dependencies));
  }

  private findDependents(moduleId: string, affected: Set<string>): void {
    for (const [id, deps] of this.dependencyGraph) {
      if (deps.has(moduleId) && !affected.has(id)) {
        affected.add(id);
        // Recursively find dependents of dependents
        this.findDependents(id, affected);
      }
    }
  }
} 