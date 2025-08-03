import {
  createApp,
  connectDatabase,
  startServer,
  shutdownServer,
} from './server';
import { config } from './shared/config/env.config';
import { connectMqtt } from './shared/services/mqtt.service';

(async () => {
  await connectDatabase();
  const app = createApp();
  await connectMqtt();
  startServer(app, config.port);
})();

process.on('SIGINT', shutdownServer);
process.on('SIGTERM', shutdownServer);
