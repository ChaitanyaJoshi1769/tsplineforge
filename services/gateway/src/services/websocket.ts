import { WebSocketServer, WebSocket } from 'ws';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

interface WSClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  projectId?: string;
}

export class WebSocketHandler {
  private clients: Map<string, WSClient> = new Map();
  private projectRooms: Map<string, Set<string>> = new Map();

  constructor(private wss: WebSocketServer) {}

  initialize() {
    logger.info('WebSocket handler initialized');
  }

  handleConnection(ws: WebSocket) {
    const clientId = uuidv4();
    const client: WSClient = { id: clientId, ws };

    this.clients.set(clientId, client);
    logger.info(`Client connected: ${clientId}`);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(clientId, message);
      } catch (error) {
        logger.error({ error }, 'Failed to parse WebSocket message');
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
      // Remove from all rooms
      for (const room of this.projectRooms.values()) {
        room.delete(clientId);
      }
      logger.info(`Client disconnected: ${clientId}`);
    });

    ws.on('error', (error) => {
      logger.error({ error }, 'WebSocket error');
    });
  }

  private handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'join':
        this.handleJoin(clientId, message.projectId);
        break;
      case 'leave':
        this.handleLeave(clientId);
        break;
      case 'edit':
        this.broadcastToRoom(client.projectId, {
          type: 'edit',
          clientId,
          data: message.data,
        });
        break;
      case 'cursor':
        this.broadcastToRoom(client.projectId, {
          type: 'cursor',
          clientId,
          position: message.position,
          user: message.user,
        });
        break;
      default:
        logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  private handleJoin(clientId: string, projectId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.projectId = projectId;

    if (!this.projectRooms.has(projectId)) {
      this.projectRooms.set(projectId, new Set());
    }

    this.projectRooms.get(projectId)!.add(clientId);

    logger.info(`Client ${clientId} joined project ${projectId}`);

    this.broadcastToRoom(projectId, {
      type: 'user_joined',
      clientId,
    });
  }

  private handleLeave(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client || !client.projectId) return;

    const room = this.projectRooms.get(client.projectId);
    if (room) {
      room.delete(clientId);
    }

    logger.info(`Client ${clientId} left project ${client.projectId}`);

    this.broadcastToRoom(client.projectId, {
      type: 'user_left',
      clientId,
    });

    client.projectId = undefined;
  }

  private broadcastToRoom(projectId: string | undefined, message: any) {
    if (!projectId) return;

    const room = this.projectRooms.get(projectId);
    if (!room) return;

    const data = JSON.stringify(message);
    for (const clientId of room) {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    }
  }
}
