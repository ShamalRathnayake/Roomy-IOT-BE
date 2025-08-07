import Joi from 'joi';

export const getSensorDataSchema = Joi.object().keys({
  deviceId: Joi.string().required(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  sensorType: Joi.string()
    .valid(
      'temperature',
      'humidity',
      'aqi',
      'eco2',
      'tvoc',
      'coPpm',
      'ch4Ppm',
      'lpgPpm',
      'nh3',
      'co2',
      'alcohol',
      'toluene',
      'acetone',
      'flameDetected',
      'flameIntensity',
      'all'
    )
    .optional(),
});
