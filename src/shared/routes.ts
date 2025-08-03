import { Router } from 'express';
import userRouter from '../modules/user/user.router';
import sensorDataRouter from '../modules/sensorData/sensorData.router';
import { WebSocketService } from './services/websocket.service';

const router = Router();

router.get('/health', (req, res): void => {
  res.status(200).json({ success: true });
});

router.get('/websocket/status', (req, res): void => {
  const connectedClients = WebSocketService.getConnectedClientsCount();
  res.status(200).json({ 
    success: true, 
    connectedClients,
    websocketEnabled: true 
  });
});

router.use('/user', userRouter);
router.use('/sensor-data', sensorDataRouter);

export default router;
