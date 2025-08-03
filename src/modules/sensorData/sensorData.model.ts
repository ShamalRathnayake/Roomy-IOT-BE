// user.model.ts
import mongoose, { Schema } from 'mongoose';
import { SensorData } from './sensorData.types';

const SensorDataSchema: Schema = new Schema(
  {
    temperature: {
      type: Number,
      default: 0,
    },
    humidity: {
      type: Number,
      default: 0,
    },
    aqi: {
      type: Number,
      default: 0,
    },
    eco2: {
      type: Number,
      default: 0,
    },
    tvoc: {
      type: Number,
      default: 0,
    },
    coPpm: {
      type: Number,
      default: 0,
    },
    ch4Ppm: {
      type: Number,
      default: 0,
    },
    lpgPpm: {
      type: Number,
      default: 0,
    },
    co2: {
      type: Number,
      default: 0,
    },
    alcohol: {
      type: Number,
      default: 0,
    },
    toluene: {
      type: Number,
      default: 0,
    },
    acetone: {
      type: Number,
      default: 0,
    },
    flameDetected: {
      type: Boolean,
      default: false,
    },
    flameIntensity: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: false,
    collection: 'SensorData',
  }
);

export const SensorDataModel = mongoose.model<SensorData>(
  'SensorData',
  SensorDataSchema
);
