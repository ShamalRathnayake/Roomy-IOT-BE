import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class WebSocketService {
  private static io: SocketIOServer;
  private static connectedClients = new Set<string>();

  static initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 WebSocket client connected: ${socket.id}`);
      this.connectedClients.add(socket.id);

      socket.on('disconnect', () => {
        console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

      socket.emit('connectionInfo', {
        clientId: socket.id,
        totalClients: this.connectedClients.size,
      });
    });

    console.log('✅ WebSocket server initialized');
  }

  static broadcastSensorData(sensorData: any) {
    if (this.io && this.connectedClients.size > 0) {
      this.io.emit('sensorData', {
        timestamp: new Date().toISOString(),
        data: sensorData,
      });
      console.log(
        `📡 Broadcasted sensor data to ${this.connectedClients.size} clients`
      );
    }
  }

  static getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  static getIO(): SocketIOServer | null {
    return this.io || null;
  }
}
