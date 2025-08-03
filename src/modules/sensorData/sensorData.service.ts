import { SensorDataModel } from './sensorData.model';

export const storeSensorData = async (data: any) => {
  if (!data) return;

  let sensorData: Record<string, any> = { timestamp: new Date() };

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

  sensorData = await new SensorDataModel(sensorData).save();
  return sensorData;
};

export class SensorDataService {
  static async getSensorData(query: any) {
    const {
      page = '1',
      limit = '10',
      temperature,
      humidity,
      aqi,
      eco2,
      tvoc,
      coPpm,
      ch4Ppm,
      lpgPpm,
      co2,
      alcohol,
      toluene,
      acetone,
      flameDetected,
      flameIntensity,
      startDate,
      endDate,
    } = query;

    const filters: Record<string, any> = {};

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
}
