import { describe, it, expect, beforeEach } from 'bun:test';
import { HMRUpdateStrategyImpl } from '../libs/hmrStrategy';
import { ModuleRegistryManager } from '../libs/moduleRegistry';

describe('Smart HMR System', () => {
  describe('HMRUpdateStrategy', () => {
    let strategy: HMRUpdateStrategyImpl;

    beforeEach(() => {
      strategy = new HMRUpdateStrategyImpl('/test/project');
    });

    it('should identify CSS files as hot-updatable', () => {
      expect(strategy.canHotUpdate('/test/styles.css', 'css')).toBe(true);
      expect(strategy.canHotUpdate('/test/styles.scss', 'css')).toBe(true);
    });

    it('should identify React components as hot-updatable', () => {
      expect(strategy.canHotUpdate('/test/components/Button.tsx', 'tsx')).toBe(true);
      expect(strategy.canHotUpdate('/test/components/Modal.jsx', 'jsx')).toBe(true);
    });

    it('should identify utility modules as hot-updatable', () => {
      expect(strategy.canHotUpdate('/test/utils/helpers.ts', 'ts')).toBe(true);
      expect(strategy.canHotUpdate('/test/lib/constants.js', 'js')).toBe(true);
    });

    it('should require reload for critical files', () => {
      expect(strategy.shouldReload('/test/app/layout.tsx', 'tsx')).toBe(true);
      expect(strategy.shouldReload('/test/app/page.tsx', 'tsx')).toBe(true);
      expect(strategy.shouldReload('/test/config.js', 'js')).toBe(true);
    });

    it('should generate consistent module IDs', () => {
      const moduleId1 = strategy.getModuleId('/test/project/src/components/Button.tsx');
      const moduleId2 = strategy.getModuleId('/test/project/src/components/Button.tsx');
      expect(moduleId1).toBe(moduleId2);
      expect(moduleId1).toBe('src/components/Button.tsx');
    });

    it('should determine correct file types', () => {
      expect(strategy.getFileType('test.css')).toBe('css');
      expect(strategy.getFileType('test.tsx')).toBe('tsx');
      expect(strategy.getFileType('test.js')).toBe('js');
      expect(strategy.getFileType('test.html')).toBe('html');
      expect(strategy.getFileType('test.txt')).toBe('other');
    });

    it('should provide update strategies', () => {
      const cssStrategy = strategy.getUpdateStrategy('/test/styles.css');
      expect(cssStrategy.type).toBe('hot');

      const layoutStrategy = strategy.getUpdateStrategy('/test/layout.tsx');
      expect(layoutStrategy.type).toBe('reload');
    });
  });

  describe('ModuleRegistryManager', () => {
    let registry: ModuleRegistryManager;

    beforeEach(() => {
      registry = new ModuleRegistryManager();
    });

    it('should register modules correctly', () => {
      registry.registerModule('src/Button.tsx', 'hash123', ['src/utils.ts']);
      
      const module = registry.getModule('src/Button.tsx');
      expect(module).toBeTruthy();
      expect(module?.hash).toBe('hash123');
      expect(module?.dependencies).toEqual(['src/utils.ts']);
    });

    it('should update module hashes', () => {
      registry.registerModule('src/Button.tsx', 'hash123');
      
      const updated = registry.updateModule('src/Button.tsx', 'hash456');
      expect(updated).toBe(true);
      
      const module = registry.getModule('src/Button.tsx');
      expect(module?.hash).toBe('hash456');
    });

    it('should not update if hash is the same', () => {
      registry.registerModule('src/Button.tsx', 'hash123');
      
      const updated = registry.updateModule('src/Button.tsx', 'hash123');
      expect(updated).toBe(false);
    });

    it('should find affected modules', () => {
      registry.registerModule('src/utils.ts', 'hash1');
      registry.registerModule('src/Button.tsx', 'hash2', ['src/utils.ts']);
      registry.registerModule('src/Modal.tsx', 'hash3', ['src/Button.tsx']);
      
      const affected = registry.getAffectedModules('src/utils.ts');
      expect(affected).toContain('src/Button.tsx');
      expect(affected).toContain('src/Modal.tsx');
    });

    it('should determine HMR support correctly', () => {
      registry.registerModule('src/Button.tsx', 'hash1');
      registry.registerModule('src/styles.css', 'hash2');
      registry.registerModule('src/config.json', 'hash3');
      
      expect(registry.canHotUpdate('src/Button.tsx')).toBe(true);
      expect(registry.canHotUpdate('src/styles.css')).toBe(true);
      expect(registry.canHotUpdate('src/config.json')).toBe(false);
    });

    it('should clear modules correctly', () => {
      registry.registerModule('src/Button.tsx', 'hash1');
      registry.clearModule('src/Button.tsx');
      
      const module = registry.getModule('src/Button.tsx');
      expect(module).toBeUndefined();
    });

    it('should provide accurate stats', () => {
      registry.registerModule('src/Button.tsx', 'hash1'); // HMR capable
      registry.registerModule('src/styles.css', 'hash2'); // HMR capable
      registry.registerModule('src/data.json', 'hash3'); // Not HMR capable
      
      const stats = registry.getStats();
      expect(stats.totalModules).toBe(3);
      expect(stats.hmrCapableModules).toBe(2);
    });
  });
}); 