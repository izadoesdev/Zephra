import { createLogger } from '../libs/logger';

const logger = createLogger('hmr:injector');

export interface HMRInjectionConfig {
  enabled: boolean;
  clientPath: string;
  port?: number;
  wsPath?: string;
}

export function injectHMRScript(
  html: string,
  config: HMRInjectionConfig
): string {
  if (!config.enabled) {
    return html;
  }

  const scriptUrl = config.port 
    ? `http://localhost:${config.port}${config.clientPath}`
    : config.clientPath;

  const hmrScript = `<script src="${scriptUrl}" defer></script>`;
  
  // Try to inject before closing head tag
  if (html.includes('</head>')) {
    const injected = html.replace('</head>', `  ${hmrScript}\n</head>`);
    logger.debug('Injected HMR script into <head>');
    return injected;
  }
  
  // Fallback: inject before closing body tag
  if (html.includes('</body>')) {
    const injected = html.replace('</body>', `  ${hmrScript}\n</body>`);
    logger.debug('Injected HMR script into <body>');
    return injected;
  }
  
  // Last resort: append to end of HTML
  logger.warn('Could not find </head> or </body> tags, appending HMR script to end');
  return html + `\n${hmrScript}`;
}

export function createHMRMiddleware(config: HMRInjectionConfig) {
  return (html: string): string => {
    return injectHMRScript(html, config);
  };
} 