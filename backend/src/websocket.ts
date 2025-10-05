import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Recording, Channel } from './types';

let wss: WebSocketServer;
const clients: Set<WebSocket> = new Set();

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
  });

  console.log('WebSocket server initialized');
}

export function broadcastRecordingUpdate(recording: Recording) {
  broadcast({
    type: 'recording_update',
    data: recording,
  });
}

export function broadcastChannelUpdate(channel: Channel) {
  broadcast({
    type: 'channel_update',
    data: channel,
  });
}

export function broadcastSystemNotification(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  broadcast({
    type: 'notification',
    data: { message, level, timestamp: new Date().toISOString() },
  });
}

function broadcast(message: any) {
  const data = JSON.stringify(message);
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
      } catch (error) {
        console.error('Error sending to client:', error);
      }
    }
  });
}

