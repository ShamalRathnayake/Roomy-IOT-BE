export const sensorThresholds: Record<string, Record<string, number>> = {
  temperature: { max: 35 },
  humidity: { max: 90 },
  aqi: { max: 100 },
  eco2: { max: 1000 },
  tvoc: { max: 300 },
  coPpm: { max: 50 },
  ch4Ppm: { max: 100 },
  lpgPpm: { max: 200 },
  nh3: { max: 50 },
  co2: { max: 1200 },
  alcohol: { max: 300 },
  toluene: { max: 50 },
  acetone: { max: 50 },
  flameIntensity: { max: 180 },
};

export const thresholdWarningMessages = {
  temperature:
    'Warning: Temperature has exceeded the safe limit. High temperatures may cause heat stress or equipment malfunction.',
  humidity:
    'Warning: Humidity is above the acceptable range. Excessive humidity can lead to condensation and mold growth.',
  aqi: 'Warning: Air Quality Index (AQI) is too high. This indicates polluted air which may affect respiratory health.',
  eco2: 'Warning: eCO₂ levels are elevated. High levels can cause discomfort and cognitive issues.',
  tvoc: 'Warning: TVOC (Total Volatile Organic Compounds) concentration is too high. Prolonged exposure may be harmful.',
  coPpm:
    'Warning: Carbon monoxide levels are too high. This can be toxic and requires immediate ventilation.',
  ch4Ppm:
    'Warning: Methane concentration is above safe limits. It is highly flammable and can cause explosions.',
  lpgPpm:
    'Warning: LPG levels are dangerously high. This poses a fire and explosion risk.',
  nh3: 'Warning: Ammonia concentration is excessive. It can irritate the eyes and respiratory system.',
  co2: 'Warning: Carbon dioxide levels are too high. Poor ventilation can lead to fatigue and reduced concentration.',
  alcohol:
    'Warning: Alcohol vapor levels have exceeded the safe limit. Ensure adequate ventilation.',
  toluene:
    'Warning: Toluene concentration is high. Long-term exposure can affect the nervous system.',
  acetone:
    'Warning: Acetone levels are too high. It can cause irritation and dizziness with prolonged exposure.',
  flameDetected:
    'Warning: Flame has been detected. Immediate fire safety measures should be taken.',
  flameIntensity:
    'Warning: Flame intensity is unusually high. This may indicate a growing fire hazard.',
};
