import { createApp } from '@zephra/framework';
import { logger } from '@zephra/framework';

// Set up configuration for the example app
const PORT = process.env.PORT || 3000;

async function startApp() {
  logger.info(`Starting Zephra web example on port ${PORT}...`);

  try {
    // Create and initialize the app
    const app = await createApp({
      // Use relative paths from the current file
      appDir: import.meta.dir,
      apiDir: 'app/api',
      pagesDir: 'app',
    });

    // Start the server
    app.listen(Number(PORT));

    logger.info(`🚀 Zephra web example is running at http://localhost:${PORT}`);
  } catch (err) {
    logger.error(`Failed to start Zephra web example: ${err}`);
    process.exit(1);
  }
}

startApp(); 