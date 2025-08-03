import Joi from 'joi';

export const getSensorDataSchema = Joi.object().keys({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  temperature: Joi.number().min(0).optional(),
  humidity: Joi.number().min(0).max(100).optional(),
  aqi: Joi.number().min(0).optional(),
  eco2: Joi.number().min(0).optional(),
  tvoc: Joi.number().min(0).optional(),
  coPpm: Joi.number().min(0).optional(),
  ch4Ppm: Joi.number().min(0).optional(),
  lpgPpm: Joi.number().min(0).optional(),
  co2: Joi.number().min(0).optional(),
  alcohol: Joi.number().min(0).optional(),
  toluene: Joi.number().min(0).optional(),
  acetone: Joi.number().min(0).optional(),
  flameDetected: Joi.boolean().optional(),
  flameIntensity: Joi.number().min(0).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});
