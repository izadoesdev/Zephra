import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { HashService } from '../../libs/hashService';
import { WebSocketManager } from '../../libs/wsManager';
import { injectHMRScript } from '../../utils/hmrInjector';
import { generateHMRClientScript } from '../../hmr/hmr-client';

describe('HMR System', () => {
  describe('HashService', () => {
    let hashService: HashService;

    beforeEach(() => {
      hashService = new HashService();
    });

    it('should generate consistent hashes for same content', async () => {
      // Create a temporary file for testing
      const testFile = '/tmp/test-hmr-file.txt';
      await Bun.write(testFile, 'test content');

      const hash1 = await hashService.getFileHash(testFile);
      const hash2 = await hashService.getFileHash(testFile);

      expect(hash1).toBe(hash2);
      expect(hash1).toBeTruthy();
    });

    it('should return empty string for non-existent files', async () => {
      const hash = await hashService.getFileHash('/non/existent/file.txt');
      expect(hash).toBe('');
    });

    it('should clear cache correctly', async () => {
      const testFile = '/tmp/test-hmr-cache.txt';
      await Bun.write(testFile, 'test content');

      await hashService.getFileHash(testFile);
      const statsBefore = hashService.getCacheStats();
      expect(statsBefore.totalFiles).toBeGreaterThan(0);

      hashService.clearCache();
      const statsAfter = hashService.getCacheStats();
      expect(statsAfter.totalFiles).toBe(0);
    });
  });

  describe('WebSocketManager', () => {
    let wsManager: WebSocketManager;

    beforeEach(() => {
      wsManager = new WebSocketManager();
    });

    it('should track client connections', () => {
      const mockSocket = {
        readyState: 1, // WebSocket.OPEN
        send: () => {},
        addEventListener: () => {}
      } as unknown as WebSocket;

      const clientId = wsManager.addClient(mockSocket);
      expect(clientId).toBeTruthy();

      const stats = wsManager.getStats();
      expect(stats.connectedClients).toBe(1);

      wsManager.removeClient(clientId);
      const statsAfter = wsManager.getStats();
      expect(statsAfter.connectedClients).toBe(0);
    });

    it('should broadcast messages to all clients', () => {
      const messages: string[] = [];
      const mockSocket = {
        readyState: 1, // WebSocket.OPEN
        send: (msg: string) => messages.push(msg),
        addEventListener: () => {}
      } as unknown as WebSocket;

      wsManager.addClient(mockSocket);
      wsManager.broadcast({
        type: 'update',
        file: 'test.js',
        hash: 'abc123'
      });

      expect(messages).toHaveLength(2); // welcome + broadcast message
      const broadcastMessage = JSON.parse(messages[1]);
      expect(broadcastMessage.type).toBe('update');
      expect(broadcastMessage.file).toBe('test.js');
    });
  });

  describe('HMR Script Injection', () => {
    it('should inject script into head tag', () => {
      const html = '<html><head><title>Test</title></head><body></body></html>';
      const config = {
        enabled: true,
        clientPath: '/hmr-client.js'
      };

      const result = injectHMRScript(html, config);
      expect(result).toContain('<script src="/hmr-client.js" defer></script>');
      expect(result).toContain('</head>');
    });

    it('should inject script into body if no head tag', () => {
      const html = '<html><body><h1>Test</h1></body></html>';
      const config = {
        enabled: true,
        clientPath: '/hmr-client.js'
      };

      const result = injectHMRScript(html, config);
      expect(result).toContain('<script src="/hmr-client.js" defer></script>');
      expect(result).toContain('</body>');
    });

    it('should not inject when disabled', () => {
      const html = '<html><head></head><body></body></html>';
      const config = {
        enabled: false,
        clientPath: '/hmr-client.js'
      };

      const result = injectHMRScript(html, config);
      expect(result).toBe(html);
      expect(result).not.toContain('hmr-client.js');
    });
  });

  describe('HMR Client Script Generation', () => {
    it('should generate valid JavaScript', () => {
      const script = generateHMRClientScript('/hmr', 3001);
      
      expect(script).toContain('WebSocket');
      expect(script).toContain('/hmr');
      expect(script).toContain('localhost:3001');
      expect(script).toContain('window.__HMR__');
    });

    it('should use location.host when no port specified', () => {
      const script = generateHMRClientScript('/hmr');
      
      expect(script).toContain('location.host');
      expect(script).not.toContain('localhost:');
    });
  });
}); 