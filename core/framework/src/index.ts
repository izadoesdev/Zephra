// Core framework exports
export { createApp } from './core';
export { startHMRServer } from './hmr/hmr-server';

// Logger exports
export { logger, createLogger } from './libs/logger';
export * from './utils/http';

// OXC Transformer exports
export { 
  createOxcTransformer, 
  transformFile, 
  transformCode,
  type OxcTransformOptions,
  type OxcTransformResult,
  type OxcBinaryPaths
} from './libs/oxc-transformer';

// Build Pipeline exports
export {
  createBuildPipeline,
  buildDirectory,
  type BuildPipelineConfig,
  type BuildResult
} from './libs/build-pipeline';

// Enhanced HMR with OXC
export {
  OxcHMRUpdateStrategy,
  type OxcHMRConfig
} from './libs/oxc-hmr-strategy';
// Type exports
export * from './types/routing';
export * from './types/api';

export type {
  PageComponentType,
  LayoutComponentProps,
  LayoutComponentType,
  ZephraAppInstance,
  Logger,
  Router
} from './types/app';