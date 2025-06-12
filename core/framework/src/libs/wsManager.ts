import { createLogger } from './logger';
import type { HMRClient, HMRMessage, HMRStats } from '../types/hmr';

const logger = createLogger('hmr:ws');

export class WebSocketManager {
  private clients: Map<string, HMRClient> = new Map();
  private messageCount = 0;
  private lastUpdate?: Date;

  addClient(socket: WebSocket): string {
    const clientId = this.generateClientId();
    const client: HMRClient = {
      id: clientId,
      socket,
      connectedAt: new Date()
    };

    this.clients.set(clientId, client);
    logger.info(`Client connected: ${clientId} (total: ${this.clients.size})`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connected',
      message: 'HMR client connected successfully'
    });

    // Setup client disconnect handler
    socket.addEventListener('close', () => {
      this.removeClient(clientId);
    });

    socket.addEventListener('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
      this.removeClient(clientId);
    });

    return clientId;
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      logger.info(`Client disconnected: ${clientId} (remaining: ${this.clients.size})`);
    }
  }

  broadcast(message: Omit<HMRMessage, 'timestamp'>): void {
    const fullMessage: HMRMessage = {
      ...message,
      timestamp: new Date()
    };

    const messageStr = JSON.stringify(fullMessage);
    let successCount = 0;
    let failureCount = 0;

    for (const [clientId, client] of this.clients) {
      try {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(messageStr);
          successCount++;
        } else {
          // Remove stale connections
          this.removeClient(clientId);
          failureCount++;
        }
      } catch (error) {
        logger.error(`Failed to send message to client ${clientId}:`, error);
        this.removeClient(clientId);
        failureCount++;
      }
    }

    this.messageCount++;
    this.lastUpdate = new Date();

    logger.debug(
      `Broadcast message (type: ${message.type}) to ${successCount} clients, ${failureCount} failures`
    );
  }

  sendToClient(clientId: string, message: Omit<HMRMessage, 'timestamp'>): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      logger.warn(`Attempted to send message to non-existent client: ${clientId}`);
      return false;
    }

    try {
      if (client.socket.readyState === WebSocket.OPEN) {
        const fullMessage: HMRMessage = {
          ...message,
          timestamp: new Date()
        };
        client.socket.send(JSON.stringify(fullMessage));
        return true;
      } else {
        this.removeClient(clientId);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to send message to client ${clientId}:`, error);
      this.removeClient(clientId);
      return false;
    }
  }

  getStats(): Pick<HMRStats, 'connectedClients' | 'totalUpdates' | 'lastUpdate'> {
    return {
      connectedClients: this.clients.size,
      totalUpdates: this.messageCount,
      lastUpdate: this.lastUpdate
    };
  }

  getConnectedClients(): HMRClient[] {
    return Array.from(this.clients.values());
  }

  closeAllConnections(): void {
    logger.info(`Closing ${this.clients.size} client connections...`);
    
    for (const [clientId, client] of this.clients) {
      try {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.close(1000, 'Server shutting down');
        }
      } catch (error) {
        logger.error(`Error closing connection for client ${clientId}:`, error);
      }
    }
    
    this.clients.clear();
    logger.info('All client connections closed');
  }

  private generateClientId(): string {
    return `hmr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 