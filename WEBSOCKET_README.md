# WebSocket Server for Real-time Sensor Data

This implementation adds WebSocket functionality to broadcast real-time sensor data to connected clients when new MQTT messages are received and stored in the database. **Clients must register with a deviceId to receive updates for that specific device.**

## Features

- **Device-Specific Broadcasting**: Only clients registered with matching deviceId receive sensor data
- **Device Registration**: Clients must register their deviceId to receive updates
- **Connection Management**: Tracks connected clients and their device associations
- **MQTT Integration**: Seamlessly integrates with existing MQTT service
- **CORS Support**: Configured for cross-origin requests
- **Status Endpoint**: HTTP endpoint to check WebSocket connection status

## Architecture

### Components

1. **WebSocketService** (`src/shared/services/websocket.service.ts`)
   - Manages WebSocket connections with deviceId mapping
   - Broadcasts sensor data only to clients with matching deviceId
   - Tracks connected clients and their device associations

2. **MQTT Integration** (`src/shared/services/mqtt.service.ts`)
   - Enhanced to broadcast data via WebSocket when sensor data is stored
   - Maintains existing MQTT functionality

3. **Server Integration** (`src/server.ts`)
   - Initializes WebSocket service with HTTP server
   - Runs on same port as HTTP server

## API Endpoints

### WebSocket Status
```
GET /websocket/status
```

**Response:**
```json
{
  "success": true,
  "connectedClients": 2,
  "connectedDevices": ["device001", "device002"],
  "websocketEnabled": true
}
```

## WebSocket Events

### Client → Server
- `connect`: Client connects to WebSocket server
- `registerDevice`: Client registers deviceId to receive updates
  ```javascript
  socket.emit('registerDevice', 'device001');
  ```
- `disconnect`: Client disconnects from WebSocket server

### Server → Client
- `connectionInfo`: Sent when client connects
  ```json
  {
    "clientId": "socket_id",
    "totalClients": 3,
    "message": "Please register your device ID using the \"registerDevice\" event"
  }
  ```
- `deviceRegistered`: Sent when device registration is successful
  ```json
  {
    "clientId": "socket_id",
    "deviceId": "device001",
    "totalClients": 3
  }
  ```
- `error`: Sent when registration fails
  ```json
  {
    "message": "Device ID is required"
  }
  ```
- `sensorData`: Broadcasted to clients with matching deviceId
  ```json
  {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "data": {
      "_id": "...",
      "temperature": 25.5,
      "humidity": 60.2,
      "aqi": 45,
      "eco2": 400,
      "tvoc": 100,
      "coPpm": 0,
      "ch4Ppm": 0,
      "lpgPpm": 0,
      "co2": 400,
      "alcohol": 0,
      "toluene": 0,
      "acetone": 0,
      "flameDetected": false,
      "flameIntensity": 0,
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "deviceId": "device001"
  }
  ```

## Client Implementation Example

### JavaScript/Node.js
```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  
  // Register device to receive updates
  socket.emit('registerDevice', 'device001');
});

socket.on('deviceRegistered', (info) => {
  console.log('Device registered:', info.deviceId);
  console.log('Total clients:', info.totalClients);
});

socket.on('sensorData', (data) => {
  console.log('New sensor data for device:', data.deviceId);
  console.log('Sensor data:', data.data);
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
```

### Browser JavaScript
```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  
  // Register device to receive updates
  socket.emit('registerDevice', 'device001');
});

socket.on('deviceRegistered', (info) => {
  console.log('Device registered:', info.deviceId);
  // Update UI to show device is registered
});

socket.on('sensorData', (data) => {
  console.log('New sensor data for device:', data.deviceId);
  // Update UI with real-time data
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});
```

## Testing

### Using the Test Page
1. Start the server: `npm run dev`
2. Open `websocket-test.html` in a browser
3. Click "Connect" to establish WebSocket connection
4. Enter a device ID and click "Register Device"
5. When MQTT messages are received for that device, sensor data will appear in real-time

### Manual Testing
```bash
# Check WebSocket status
curl http://localhost:3000/websocket/status

# Expected response:
{
  "success": true,
  "connectedClients": 1,
  "connectedDevices": ["device001"],
  "websocketEnabled": true
}
```

## Device ID Extraction

The system automatically extracts deviceId from sensor data in the following order:

1. **Direct deviceId field**: `sensorData.deviceId`
2. **Sensor object deviceId**: `sensorData.aht21.deviceId`, `sensorData.ens160.deviceId`, etc.

If no deviceId is found in the sensor data, the broadcast is skipped.

## Configuration

### CORS Settings
The WebSocket server is configured with CORS enabled for all origins. In production, you should restrict this to your frontend domain:

```typescript
// In websocket.service.ts
cors: {
  origin: "https://your-frontend-domain.com", // Restrict in production
  methods: ["GET", "POST"]
}
```

### Port Configuration
The WebSocket server runs on the same port as the HTTP server (default: 3000). Clients should connect to the same URL as the HTTP API.

## Dependencies

- `socket.io`: WebSocket server implementation
- `@types/socket.io`: TypeScript definitions

## Installation

The required dependencies are already installed:
```bash
npm install socket.io @types/socket.io
```

## Flow Diagram

```
MQTT Broker → MQTT Service → Store in Database → Extract DeviceId → WebSocket Service → Broadcast to Matching Clients
     ↓              ↓              ↓                    ↓                    ↓                    ↓
  Sensor Data   Parse Data   Save to MongoDB    Find DeviceId    Filter by DeviceId    Send to Specific Clients
```

## Security Considerations

1. **Device Authentication**: Consider adding authentication for device registration
2. **CORS Configuration**: Restrict origins in production
3. **Rate Limiting**: Consider implementing rate limiting for WebSocket connections
4. **Input Validation**: Validate deviceId format and length
5. **Device Isolation**: Ensure devices can only receive their own data

## Troubleshooting

### Common Issues

1. **No Data Received**
   - Ensure device is registered with correct deviceId
   - Verify MQTT broker is running and sending data
   - Check that sensor data contains deviceId
   - Verify WebSocket connection status

2. **Device Registration Fails**
   - Ensure deviceId is provided and not empty
   - Check WebSocket connection is established first

3. **Wrong Device Receiving Data**
   - Verify deviceId in sensor data matches registered deviceId
   - Check for deviceId extraction logic

### Debug Logs
The server provides detailed logging:
- WebSocket connections/disconnections
- Device registration events
- MQTT message processing
- Device-specific data broadcasting events

## Performance Considerations

- WebSocket connections are lightweight
- Device-specific broadcasting is more efficient than broadcasting to all clients
- Consider implementing rooms/namespaces for large-scale deployments
- Monitor memory usage with many concurrent device connections 