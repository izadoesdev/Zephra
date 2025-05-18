export const hmrScript = `<script>(() => {
  const ws = new WebSocket('ws://localhost:3001/hmr');
  ws.onmessage = (msg) => {
    if (msg.data === 'reload') {
      window.location.reload();
    }
  };
})();</script>`; 