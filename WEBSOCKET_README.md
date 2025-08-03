# WebSocket Server for Real-time Sensor Data

This implementation adds WebSocket functionality to broadcast real-time sensor data to connected clients when new MQTT messages are received and stored in the database.

## Features

- **Real-time Broadcasting**: Automatically broadcasts sensor data to all connected WebSocket clients
- **Connection Management**: Tracks connected clients and provides connection status
- **MQTT Integration**: Seamlessly integrates with existing MQTT service
- **CORS Support**: Configured for cross-origin requests
- **Status Endpoint**: HTTP endpoint to check WebSocket connection status

## Architecture

### Components

1. **WebSocketService** (`src/shared/services/websocket.service.ts`)
   - Manages WebSocket connections
   - Broadcasts sensor data to clients
   - Tracks connected clients

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
  "websocketEnabled": true
}
```

## WebSocket Events

### Client → Server
- `connect`: Client connects to WebSocket server
- `disconnect`: Client disconnects from WebSocket server

### Server → Client
- `connectionInfo`: Sent when client connects
  ```json
  {
    "clientId": "socket_id",
    "totalClients": 3
  }
  ```
- `sensorData`: Broadcasted when new sensor data is stored
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
    }
  }
  ```

## Client Implementation Example

### JavaScript/Node.js
```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('connectionInfo', (info) => {
  console.log('Client ID:', info.clientId);
  console.log('Total clients:', info.totalClients);
});

socket.on('sensorData', (data) => {
  console.log('New sensor data:', data);
  // Handle real-time sensor data
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
});

socket.on('sensorData', (data) => {
  console.log('New sensor data:', data);
  // Update UI with real-time data
});
```

## Testing

### Using the Test Page
1. Start the server: `npm run dev`
2. Open `websocket-test.html` in a browser
3. Click "Connect" to establish WebSocket connection
4. When MQTT messages are received, sensor data will appear in real-time

### Manual Testing
```bash
# Check WebSocket status
curl http://localhost:3000/websocket/status

# Expected response:
{
  "success": true,
  "connectedClients": 0,
  "websocketEnabled": true
}
```

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
MQTT Broker → MQTT Service → Store in Database → WebSocket Service → Broadcast to Clients
     ↓              ↓              ↓                    ↓                    ↓
  Sensor Data   Parse Data   Save to MongoDB    Format Data      Send to All Clients
```

## Security Considerations

1. **CORS Configuration**: Restrict origins in production
2. **Rate Limiting**: Consider implementing rate limiting for WebSocket connections
3. **Authentication**: Add authentication if needed for sensitive data
4. **Input Validation**: Validate all incoming WebSocket messages

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure server is running on correct port
   - Check firewall settings

2. **CORS Errors**
   - Verify CORS configuration in WebSocket service
   - Check client origin settings

3. **No Data Received**
   - Verify MQTT broker is running and sending data
   - Check WebSocket connection status
   - Ensure sensor data is being stored in database

### Debug Logs
The server provides detailed logging:
- WebSocket connections/disconnections
- MQTT message processing
- Data broadcasting events

## Performance Considerations

- WebSocket connections are lightweight
- Broadcasting is efficient for multiple clients
- Consider implementing rooms/namespaces for large-scale deployments
- Monitor memory usage with many concurrent connections 