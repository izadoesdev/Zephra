import { createApp } from '@zephra/framework';
import { logger } from '@zephra/framework';

const PORT = process.env.PORT || 3000;

let server: { stop?: () => Promise<void> | void } | undefined;

async function startApp() {
  logger.info(`Starting Zephra web example on port ${PORT}...`);

  try {
    const app = await createApp({
      appDir: import.meta.dir,
      apiDir: 'app/api',
      pagesDir: 'app',
    });

    server = app.listen(Number(PORT));

    logger.info(`🚀 Zephra web example is running at http://localhost:${PORT}`);
  } catch (err) {
    logger.error(`Failed to start Zephra web example: ${err}`);
    process.exit(1);
  }
}

async function shutdown() {
  logger.info('Shutting down Zephra web example...');
  try {
    if (server && typeof server.stop === 'function') {
      await server.stop();
      logger.info('Server stopped gracefully.');
    }
  } catch (err) {
    logger.error(`Error during shutdown: ${err}`);
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startApp(); 