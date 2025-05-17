import pino from 'pino';

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
};const logger = createLogger();

export { logger, createLogger };

