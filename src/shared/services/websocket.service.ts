import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface ClientInfo {
  socketId: string;
  deviceId: string;
}

export class WebSocketService {
  private static io: SocketIOServer;
  private static connectedClients = new Map<string, ClientInfo>();

  static initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 WebSocket client connected: ${socket.id}`);

      
      socket.on('registerDevice', (deviceId: string) => {
        if (!deviceId) {
          socket.emit('error', { message: 'Device ID is required' });
          return;
        }

        
        this.connectedClients.set(socket.id, {
          socketId: socket.id,
          deviceId: deviceId,
        });

        console.log(`📱 Device ${deviceId} registered for socket ${socket.id}`);

        
        socket.emit('deviceRegistered', {
          clientId: socket.id,
          deviceId: deviceId,
          totalClients: this.connectedClients.size,
        });
      });

      socket.on('disconnect', () => {
        console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

     
      socket.emit('connectionInfo', {
        clientId: socket.id,
        totalClients: this.connectedClients.size,
        message: 'Please register your device ID using the "registerDevice" event',
      });
    });

    console.log('✅ WebSocket server initialized');
  }

  static broadcastSensorData(sensorData: any) {
    if (!this.io || this.connectedClients.size === 0) {
      return;
    }

   
    const deviceId = this.extractDeviceId(sensorData);
    
    if (!deviceId) {
      console.log('⚠️ No deviceId found in sensor data, skipping broadcast');
      return;
    }

  
    const matchingClients = Array.from(this.connectedClients.values()).filter(
      (client) => client.deviceId === deviceId
    );

    if (matchingClients.length === 0) {
      console.log(`📡 No clients registered for device ${deviceId}`);
      return;
    }

   
    const message = {
      timestamp: new Date().toISOString(),
      data: sensorData,
      deviceId: deviceId,
    };

    matchingClients.forEach((client) => {
      this.io.to(client.socketId).emit('sensorData', message);
    });

    console.log(
      `📡 Broadcasted sensor data to ${matchingClients.length} clients for device ${deviceId}`
    );
  }

  private static extractDeviceId(sensorData: any): string | null {
    
    if (sensorData.deviceId) {
      return sensorData.deviceId;
    }

    
    const sensorObjects = ['aht21', 'ens160', 'mq9', 'mq135', 'temp'];
    for (const sensorKey of sensorObjects) {
      if (sensorData[sensorKey]?.deviceId) {
        return sensorData[sensorKey].deviceId;
      }
    }

    
    return null;
  }

  static getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  static getConnectedDevices(): string[] {
    return Array.from(this.connectedClients.values()).map((client) => client.deviceId);
  }

  static getIO(): SocketIOServer | null {
    return this.io || null;
  }
}
