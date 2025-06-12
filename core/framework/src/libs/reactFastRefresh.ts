import { createLogger } from './logger';

const logger = createLogger('hmr:fast-refresh');

// Type declarations for browser environment
declare global {
  interface Window {
    __REACT_FAST_REFRESH__?: any;
    addEventListener: (type: string, listener: EventListener) => void;
    dispatchEvent: (event: Event) => boolean;
  }
}

export class ReactFastRefreshManager {
  private componentRegistry: Map<string, any> = new Map();
  private stateCache: Map<string, any> = new Map();

  /**
   * Initialize Fast Refresh for the client
   */
  initialize(): void {
    // Check if we're in a browser environment
    if (typeof globalThis === 'undefined' || !('window' in globalThis)) {
      return; // Server-side, nothing to do
    }

    const win = (globalThis as any).window;

    // Listen for HMR React refresh events
    win.addEventListener('hmr-react-refresh', this.handleRefreshEvent.bind(this));
    
    // Expose Fast Refresh API globally for debugging
    win.__REACT_FAST_REFRESH__ = {
      register: this.registerComponent.bind(this),
      getState: this.getComponentState.bind(this),
      setState: this.setComponentState.bind(this),
      refresh: this.refreshComponent.bind(this)
    };

    logger.info('React Fast Refresh initialized');
  }

  /**
   * Register a React component for Fast Refresh tracking
   */
  registerComponent(name: string, component: any, instance?: any): void {
    this.componentRegistry.set(name, {
      component,
      instance,
      registeredAt: Date.now()
    });
    
    logger.debug(`Registered component for Fast Refresh: ${name}`);
  }

  /**
   * Get the current state of a component
   */
  getComponentState(componentName: string): any {
    return this.stateCache.get(componentName);
  }

  /**
   * Set the state for a component
   */
  setComponentState(componentName: string, state: any): void {
    this.stateCache.set(componentName, state);
    logger.debug(`Cached state for component: ${componentName}`);
  }

  /**
   * Refresh a specific component while preserving state
   */
  refreshComponent(componentName: string, newComponent: any): boolean {
    try {
      const registered = this.componentRegistry.get(componentName);
      if (!registered) {
        logger.warn(`Component ${componentName} not registered for Fast Refresh`);
        return false;
      }

      // Update the component in registry
      this.componentRegistry.set(componentName, {
        ...registered,
        component: newComponent,
        lastRefresh: Date.now()
      });

      // Trigger React to re-render
      this.triggerReactUpdate(componentName);
      
      logger.info(`Fast refreshed component: ${componentName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to refresh component ${componentName}:`, error);
      return false;
    }
  }

  /**
   * Handle HMR refresh events from the client
   */
  private handleRefreshEvent(event: CustomEvent): void {
    const { moduleId, componentCode } = event.detail;
    
    try {
      // Extract component name from module ID
      const componentName = this.extractComponentNameFromModuleId(moduleId);
      if (!componentName) {
        logger.warn(`Could not extract component name from module: ${moduleId}`);
        return;
      }

      // For now, we'll trigger a simple refresh
      // In a full implementation, you'd evaluate the new component code
      this.refreshComponent(componentName, null);
      
    } catch (error) {
      logger.error(`Error handling refresh event:`, error);
    }
  }

  /**
   * Trigger React to update components
   */
  private triggerReactUpdate(componentName: string): void {
    // This is a simplified approach
    // In a real implementation, you'd need to:
    // 1. Find React component instances in the fiber tree
    // 2. Mark them for update
    // 3. Trigger React's reconciliation process

    // For now, we'll dispatch a custom event that React components can listen to
    if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
      const updateEvent = new CustomEvent('react-component-update', {
        detail: { componentName }
      });
      (globalThis as any).window.dispatchEvent(updateEvent);
    }
  }

  /**
   * Extract component name from module ID
   */
  private extractComponentNameFromModuleId(moduleId: string): string | null {
    const parts = moduleId.split('/');
    const fileName = parts[parts.length - 1];
    const nameMatch = fileName.match(/^([A-Z][a-zA-Z0-9]*)\.(tsx|jsx)$/);
    return nameMatch ? nameMatch[1] : null;
  }

  /**
   * Check if a component can be safely refreshed
   */
  canRefresh(componentName: string): boolean {
    const registered = this.componentRegistry.get(componentName);
    return !!registered;
  }

  /**
   * Get statistics about registered components
   */
  getStats(): { registeredComponents: number; cachedStates: number } {
    return {
      registeredComponents: this.componentRegistry.size,
      cachedStates: this.stateCache.size
    };
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.componentRegistry.clear();
    this.stateCache.clear();
    logger.info('Cleared Fast Refresh cache');
  }
}

// Export a singleton instance
export const fastRefreshManager = new ReactFastRefreshManager();

// Auto-initialize if in browser environment
if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
  fastRefreshManager.initialize();
} 