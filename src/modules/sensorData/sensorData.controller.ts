/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../shared/utils/response.utils';
import { AppError } from '../../shared/utils/error.utils';
import { createUnexpectedError } from '../../shared/utils/error.factory.utils';
import { SensorDataService } from './sensorData.service';
import { logRequestEnd, logRequestInit } from '../../shared/utils/logger.utils';

export const getSensorData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    await logRequestInit(req, 'getSensorData', 'Sensor data retrieval process started');
    
    const result = await SensorDataService.getSensorData(req.query);
    
    await logRequestEnd(req, 'getSensorData', 'Sensor data retrieved successfully');

    return sendSuccess(res, result, 'Sensor data retrieved successfully', 200);
  } catch (err: any) {
    if (err instanceof AppError) next(err);
    else throw createUnexpectedError(err?.message);
  }
};
