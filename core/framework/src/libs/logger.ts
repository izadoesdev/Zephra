import pino from 'pino';
import { createFileManager } from './fileManager';
import path from 'node:path';

const createLogger = (prefix = 'zephra') => {
  return pino({
    name: prefix,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
    level: process.env.ZEPHRA_DEBUG === 'true' || Bun.env.ZEPHRA_DEBUG === 'true' ? 'debug' : 'info',
  });
};

const logger = createLogger();

const diagnosticsDir = path.join(process.cwd(), '.zephra');
const diagnosticsFilename = 'diagnostics.json';
const diagnosticsFileManager = createFileManager(diagnosticsDir);

async function writeDiagnostics(info: unknown) {
  try {
    await diagnosticsFileManager.writeFile(diagnosticsFilename, JSON.stringify(info, null, 2));
  } catch (err) {
    logger.error(`Failed to write diagnostics: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export { logger, createLogger, writeDiagnostics };

