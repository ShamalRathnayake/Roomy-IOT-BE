import mqtt from 'mqtt';
import { storeSensorData } from '../../modules/sensorData/sensorData.service';
import { WebSocketService } from './websocket.service';

const expectedTopics: Record<string, string> = {
  'sensor/data/aht21': 'aht21',
  'sensor/data/ens160': 'ens160',
  'sensor/data/mq9': 'mq9',
  'sensor/data/mq135': 'mq135',
  'sensor/data/temp': 'temp',
};

export const connectMqtt = async () => {
  let buffer: Record<string, number> = {};
  const receivedTopics = new Set();

  const client = mqtt.connect('mqtt://mqtt-broker:1883');

  client.on('connect', () => {
    console.log('🔗 Connected to MQTT broker');
    client.subscribe(Object.keys(expectedTopics));
  });

  client.on('message', async (topic, message) => {
    if (!expectedTopics[topic]) return;

    try {
      const value = JSON.parse(message.toString());

      buffer[expectedTopics[topic]] = value;
      receivedTopics.add(topic);

      if (receivedTopics.size === Object.keys(expectedTopics).length) {
        const sensorData = await storeSensorData(buffer);
        
        // Broadcast the sensor data to all connected WebSocket clients
        if (sensorData) {
          WebSocketService.broadcastSensorData(sensorData);
        }

        buffer = {};
        receivedTopics.clear();
      }
    } catch (err) {
      console.error(`Invalid message from ${topic}:`, message.toString(), err);
    }
  });

  client.on('error', (err) => {
    console.error('❌ MQTT connection error:', err);
  });

  client.on('close', () => {
    console.log('🔌 MQTT connection closed');
  });
};
