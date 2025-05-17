import { describe, it, expect } from 'bun:test';
import { DEFAULT_CONFIG } from '../../config/app'; // Adjusted path

describe('Application Default Configuration', () => {
  it('should have correct default appDir', () => {
    // process.cwd() can vary, so we just check if it's a non-empty string, 
    // as its exact value depends on where the test runner is invoked.
    expect(typeof DEFAULT_CONFIG.appDir).toBe('string');
    expect(DEFAULT_CONFIG.appDir.length).toBeGreaterThan(0);
  });

  it('should have correct default apiDir', () => {
    expect(DEFAULT_CONFIG.apiDir).toBe('app/api');
  });

  it('should have correct default pagesDir', () => {
    expect(DEFAULT_CONFIG.pagesDir).toBe('app');
  });

  it('should have correct default appName', () => {
    expect(DEFAULT_CONFIG.appName).toBe('ZephraApp');
  });

  it('should have correct default logPrefix', () => {
    expect(DEFAULT_CONFIG.logPrefix).toBe('app');
  });
}); 