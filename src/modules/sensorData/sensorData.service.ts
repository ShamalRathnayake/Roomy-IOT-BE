import { SensorDataModel } from './sensorData.model';
import { UserModel } from '../user/user.model';
import { sensorThresholds } from '../../shared/config/sensor.config';
import { EmailService } from '../../shared/services/email.service';
import { UserService } from '../user/user.service';

export class SensorDataService {
  static async storeSensorData(data: any) {
    if (!data) return;

    let sensorData: Record<string, any> = { timestamp: new Date() };

    let deviceId = null;
    const sensorObjects = ['aht21', 'ens160', 'mq9', 'mq135', 'temp'];
    for (const sensorKey of sensorObjects) {
      if (data[sensorKey]?.deviceId) {
        deviceId = data[sensorKey].deviceId;
        break;
      }
    }

    if (!deviceId) {
      console.log('⚠️ No deviceId found in sensor data');
      return;
    }

    sensorData.deviceId = deviceId;

    if (data?.aht21)
      sensorData = {
        ...sensorData,
        ...data.aht21,
      };

    if (data?.ens160)
      sensorData = {
        ...sensorData,
        ...data.ens160,
      };

    if (data?.mq9)
      sensorData = {
        ...sensorData,
        coPpm: data.mq9.co_ppm,
        ch4Ppm: data.mq9.ch4_ppm,
        lpgPpm: data.mq9.lpg_ppm,
      };

    if (data?.mq135)
      sensorData = {
        ...sensorData,
        ...data.mq135,
      };

    if (data?.temp)
      sensorData = {
        ...sensorData,
        flameDetected: data.temp.flame_detected,
        flameIntensity: 4095 - data.temp.flame_intensity,
      };

    const user = await UserService.getUserByDeviceId(deviceId);

    sensorData = (await new SensorDataModel(sensorData).save()).toObject();

    await this.checkThreshold(sensorData, user);
    return sensorData;
  }

  static async getSensorData(query: any, userId: string) {
    const {
      page = '1',
      limit = '10',
      deviceId,
      temperature,
      humidity,
      aqi,
      eco2,
      tvoc,
      coPpm,
      ch4Ppm,
      lpgPpm,
      nh3,
      co2,
      alcohol,
      toluene,
      acetone,
      flameDetected,
      flameIntensity,
      startDate,
      endDate,
    } = query;

    if (!deviceId) {
      throw new Error('Device ID is required');
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.ownedDevices.includes(deviceId)) {
      throw new Error('You do not have access to this device');
    }

    const filters: Record<string, any> = {};

    // Add deviceId filter
    filters.deviceId = deviceId;

    // Add numeric filters
    if (temperature) {
      filters.temperature = { $gte: parseFloat(temperature) };
    }
    if (humidity) {
      filters.humidity = { $gte: parseFloat(humidity) };
    }
    if (aqi) {
      filters.aqi = { $gte: parseFloat(aqi) };
    }
    if (eco2) {
      filters.eco2 = { $gte: parseFloat(eco2) };
    }
    if (tvoc) {
      filters.tvoc = { $gte: parseFloat(tvoc) };
    }
    if (coPpm) {
      filters.coPpm = { $gte: parseFloat(coPpm) };
    }
    if (ch4Ppm) {
      filters.ch4Ppm = { $gte: parseFloat(ch4Ppm) };
    }
    if (lpgPpm) {
      filters.lpgPpm = { $gte: parseFloat(lpgPpm) };
    }
    if (nh3) {
      filters.nh3 = { $gte: parseFloat(nh3) };
    }
    if (co2) {
      filters.co2 = { $gte: parseFloat(co2) };
    }
    if (alcohol) {
      filters.alcohol = { $gte: parseFloat(alcohol) };
    }
    if (toluene) {
      filters.toluene = { $gte: parseFloat(toluene) };
    }
    if (acetone) {
      filters.acetone = { $gte: parseFloat(acetone) };
    }
    if (flameIntensity) {
      filters.flameIntensity = { $gte: parseFloat(flameIntensity) };
    }

    if (flameDetected !== undefined) {
      filters.flameDetected = flameDetected === 'true';
    }

    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) {
        filters.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filters.timestamp.$lte = new Date(endDate);
      }
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const mongoQuery = Object.keys(filters).length > 0 ? filters : {};

    const totalCount = await SensorDataModel.countDocuments(mongoQuery);

    const data = await SensorDataModel.find(mongoQuery)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return {
      data,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNum + 1 : null,
        prevPage: hasPrevPage ? pageNum - 1 : null,
      },
    };
  }

  static async checkThreshold(sensorData: Record<string, any>, user: any) {
    const sensorValues = Object.entries(sensorData);

    const alertValues = [];

    for (const [key, value] of sensorValues) {
      if (
        sensorThresholds[key]?.max <= value ||
        (key === 'flameDetected' && sensorData?.flameDetected)
      ) {
        alertValues.push(
          key === 'flameDetected'
            ? {
                type: 'flameDetected',
                threshold: null,
                currentValue: sensorData?.flameIntensity,
              }
            : {
                type: key,
                threshold: sensorThresholds[key].max,
                currentValue: value,
              }
        );
      }
    }

    if (alertValues.length === 0) return;

    await EmailService.sendEmail({
      to: user.email,
      data: alertValues,
    });
  }
}
