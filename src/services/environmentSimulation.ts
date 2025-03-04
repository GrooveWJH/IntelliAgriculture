import dayjs from 'dayjs';

export interface WeatherCondition {
  type: '晴天' | '多云' | '阴天' | '小雨' | '中雨' | '大雨';
  temperature: number;
  humidity: number;
  cloudCover: number; // 0-1
  precipitation: number; // mm/h
}

interface SimulationParameters {
  baseTemperature: number;
  temperatureAmplitude: number;
  baseHumidity: number;
  humidityVariation: number;
  baseCO2: number;
  co2Variation: number;
  baseLightIntensity: number;
  lightVariation: number;
  weatherChangeInterval: number; // hours
}

const defaultParams: SimulationParameters = {
  baseTemperature: 22,
  temperatureAmplitude: 5,
  baseHumidity: 65,
  humidityVariation: 15,
  baseCO2: 400,
  co2Variation: 100,
  baseLightIntensity: 2000,
  lightVariation: 1000,
  weatherChangeInterval: 6,
};

const weatherTypes: WeatherCondition[] = [
  { type: '晴天', temperature: 2, humidity: -10, cloudCover: 0.1, precipitation: 0 },
  { type: '多云', temperature: 0, humidity: 0, cloudCover: 0.4, precipitation: 0 },
  { type: '阴天', temperature: -1, humidity: 10, cloudCover: 0.8, precipitation: 0 },
  { type: '小雨', temperature: -2, humidity: 20, cloudCover: 0.9, precipitation: 2 },
  { type: '中雨', temperature: -3, humidity: 30, cloudCover: 0.95, precipitation: 8 },
  { type: '大雨', temperature: -4, humidity: 40, cloudCover: 1, precipitation: 20 },
];

let currentWeather = weatherTypes[0];
let lastWeatherChange = Date.now();

export const updateWeather = () => {
  const now = Date.now();
  if (now - lastWeatherChange > defaultParams.weatherChangeInterval * 3600000) {
    // 根据季节和时间调整天气概率
    const hour = dayjs().hour();
    const isDay = hour >= 6 && hour <= 18;
    
    let weights = [3, 2, 1, 1, 0.5, 0.2]; // 默认天气概率权重
    
    if (!isDay) {
      weights = [1, 2, 2, 1, 0.5, 0.2]; // 夜间更容易阴天
    }
    
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const random = Math.random() * totalWeight;
    let sum = 0;
    
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random <= sum) {
        currentWeather = weatherTypes[i];
        break;
      }
    }
    
    lastWeatherChange = now;
  }
  return currentWeather;
};

export const simulateEnvironment = () => {
  const now = dayjs();
  const hour = now.hour() + now.minute() / 60;
  const weather = updateWeather();
  
  // 温度日变化：基础温度 + 日变化幅度 + 天气影响
  const temperature = 
    defaultParams.baseTemperature + 
    defaultParams.temperatureAmplitude * Math.sin((hour - 6) * Math.PI / 12) +
    weather.temperature;
  
  // 湿度：基础湿度 + 天气影响 - 温度影响
  const humidity = 
    defaultParams.baseHumidity + 
    weather.humidity - 
    (temperature - defaultParams.baseTemperature) * 0.5;
  
  // CO2浓度：基础浓度 + 光合作用影响
  const co2 = 
    defaultParams.baseCO2 + 
    defaultParams.co2Variation * Math.sin((hour - 12) * Math.PI / 12);
  
  // 光照强度：考虑时间和云量
  const lightIntensity = 
    hour >= 6 && hour <= 18
      ? defaultParams.baseLightIntensity * 
        (1 - weather.cloudCover) * 
        Math.sin((hour - 6) * Math.PI / 12)
      : 0;
  
  // 土壤相关参数变化较慢
  const soilTemperature = temperature * 0.8 + defaultParams.baseTemperature * 0.2;
  const soilMoisture = Math.min(
    85,
    defaultParams.baseHumidity + weather.precipitation * 2
  );
  const soilPH = 6.5 + (Math.random() - 0.5) * 0.1;
  const ec = 1.2 + (Math.random() - 0.5) * 0.1;
  
  return {
    airTemperature: Number(temperature.toFixed(2)),
    airHumidity: Number(Math.min(100, Math.max(0, humidity)).toFixed(2)),
    soilMoisture: Number(soilMoisture.toFixed(2)),
    soilTemperature: Number(soilTemperature.toFixed(2)),
    co2Level: Number(co2.toFixed(2)),
    lightIntensity: Number(lightIntensity.toFixed(2)),
    soilPH: Number(soilPH.toFixed(2)),
    ec: Number(ec.toFixed(2)),
    weather: weather.type,
  };
}; 