import { Elysia } from 'elysia';
import { watch } from 'node:fs';

// Elysia's WebSocket type is not exported, so we use unknown for type safety
// You can refine this if you have a custom context

type HMRSocket = unknown | null;

export function startHMRServer({ watchDir = '.', wsPath = '/hmr', port = 3001 } = {}) {
  let currentSocket: HMRSocket = null;

  const app = new Elysia()
    .ws(wsPath, {
      open(ws) {
        currentSocket = ws;
      },
      close(ws) {
        if (currentSocket === ws) currentSocket = null;
      },
      message(ws, message) {
        ws.send(message);
      }
    })
    .listen(port);

  watch(watchDir, { recursive: true }, () => {
    if (currentSocket) {
      (currentSocket as { send: (msg: string) => void }).send('reload');
    }
  });

  return app;
}