import dayjs from 'dayjs';
import { weatherService, WeatherData } from './WeatherDataService';

export interface WeatherCondition {
  type: '晴天' | '多云' | '阴天' | '小雨' | '中雨' | '大雨';
  temperature: number;
  humidity: number;
  cloudCover: number; // 0-1
  precipitation: number; // mm/h
}

export interface GreenhouseProperties {
  thermalInsulation: number;   // 保温系数 (0-1)
  lightTransmission: number;   // 光线透过率 (0-1)
  airTightness: number;        // 密封性能 (0-1)
  volume: number;              // 大棚容积 (m³)
  coverageArea: number;        // 大棚覆盖面积 (m²)
}

// 默认大棚物理属性
const defaultGreenhouseProps: GreenhouseProperties = {
  thermalInsulation: 0.8,    // 较好的保温性能
  lightTransmission: 0.7,    // 70%的光线透过率
  airTightness: 0.9,         // 较好的密封性
  volume: 3000,              // 3000立方米容积
  coverageArea: 1000         // 1000平方米覆盖面积
};

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

// 控制系统效果
interface ControlEffects {
  ventilation: number;      // 通风系统功率 (0-100%)
  heating: number;          // 加热系统功率 (0-100%)
  cooling: number;          // 制冷系统功率 (0-100%)
  humidification: number;   // 加湿系统功率 (0-100%)
  dehumidification: number; // 除湿系统功率 (0-100%)
  lighting: number;         // 补光系统功率 (0-100%)
  irrigation: number;       // 灌溉系统功率 (0-100%)
  co2Injection: number;     // CO2注入系统功率 (0-100%)
}

// 默认控制效果（全部关闭）
const defaultControlEffects: ControlEffects = {
  ventilation: 0,
  heating: 0,
  cooling: 0,
  humidification: 0,
  dehumidification: 0,
  lighting: 0,
  irrigation: 0,
  co2Injection: 0
};

// 全局状态
let currentWeather: WeatherCondition = { type: '晴天', temperature: 0, humidity: 0, cloudCover: 0, precipitation: 0 };
let lastWeatherChange = Date.now();
let greenhouseProps = { ...defaultGreenhouseProps };
let controlEffects = { ...defaultControlEffects };
let weatherDataDriven = true; // 是否使用天气数据驱动

// 更新控制系统效果
export const setControlEffects = (effects: Partial<ControlEffects>): void => {
  controlEffects = { ...controlEffects, ...effects };
};

// 获取当前控制系统效果
export const getControlEffects = (): ControlEffects => {
  return { ...controlEffects };
};

// 更新大棚物理属性
export const setGreenhouseProperties = (props: Partial<GreenhouseProperties>): void => {
  greenhouseProps = { ...greenhouseProps, ...props };
};

// 获取当前大棚物理属性
export const getGreenhouseProperties = (): GreenhouseProperties => {
  return { ...greenhouseProps };
};

// 设置是否使用天气数据驱动
export const setWeatherDataDriven = (enabled: boolean): void => {
  weatherDataDriven = enabled;
};

// 获取是否使用天气数据驱动
export const isWeatherDataDriven = (): boolean => {
  return weatherDataDriven;
};

/**
 * 传统方法更新天气（基于概率随机生成）
 */
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
    
    const weatherTypes: WeatherCondition[] = [
      { type: '晴天', temperature: 2, humidity: -10, cloudCover: 0.1, precipitation: 0 },
      { type: '多云', temperature: 0, humidity: 0, cloudCover: 0.4, precipitation: 0 },
      { type: '阴天', temperature: -1, humidity: 10, cloudCover: 0.8, precipitation: 0 },
      { type: '小雨', temperature: -2, humidity: 20, cloudCover: 0.9, precipitation: 2 },
      { type: '中雨', temperature: -3, humidity: 30, cloudCover: 0.95, precipitation: 8 },
      { type: '大雨', temperature: -4, humidity: 40, cloudCover: 1, precipitation: 20 },
    ];
    
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

/**
 * 从天气数据服务获取天气数据
 */
export const getWeatherData = async (): Promise<WeatherData> => {
  return weatherService.getCurrentWeather();
};

/**
 * 基于天气数据计算大棚内环境
 * @param weatherData 天气数据
 * @returns 大棚内环境参数
 */
export const calculateIndoorEnvironment = (weatherData: WeatherData, controlEffects: ControlEffects) => {
  const { temperature, humidity, cloudCover, precipitation, windSpeed } = weatherData;
  const { thermalInsulation, lightTransmission, airTightness } = greenhouseProps;
  
  // 温度计算，考虑保温性和控制系统
  let indoorTemp = temperature;
  
  // 基础温差（室内比室外温暖）
  const baseInsulation = 3 * thermalInsulation;
  indoorTemp += baseInsulation;
  
  // 控制系统影响
  indoorTemp += (controlEffects.heating * 0.1) - (controlEffects.cooling * 0.15) - (controlEffects.ventilation * windSpeed * 0.03);
  
  // 阳光效应（晴天增加温度）
  const solarEffect = (1 - cloudCover) * 5 * lightTransmission;
  
  // 计算当前小时的太阳高度影响
  const hour = dayjs().hour();
  const isDay = hour >= 6 && hour <= 18;
  if (isDay) {
    // 太阳高度影响（中午最强）
    const solarHeight = Math.sin((hour - 6) * Math.PI / 12);
    indoorTemp += solarEffect * solarHeight;
  }
  
  // 湿度计算，考虑密封性和控制系统
  let indoorHumidity = humidity;
  
  // 雨天湿度影响
  if (precipitation > 0) {
    indoorHumidity += (1 - airTightness) * 10;
  }
  
  // 控制系统影响
  indoorHumidity += (controlEffects.humidification * 0.3) - (controlEffects.dehumidification * 0.3) - (controlEffects.ventilation * 0.1);
  
  // 温度对湿度的反向影响（温度高时湿度降低）
  indoorHumidity -= (indoorTemp - temperature) * 0.5;
  
  // 确保湿度在合理范围内
  indoorHumidity = Math.max(30, Math.min(100, indoorHumidity));
  
  // CO2浓度计算
  let co2Level = defaultParams.baseCO2;
  
  // 通风影响（降低CO2）
  co2Level -= controlEffects.ventilation * 2;
  
  // CO2注入系统
  co2Level += controlEffects.co2Injection * 5;
  
  // 植物光合作用消耗CO2
  const photosynthesis = isDay ? (1 - cloudCover) * lightTransmission * 50 : 0;
  co2Level -= photosynthesis;
  
  // 确保CO2在合理范围内
  co2Level = Math.max(300, Math.min(2000, co2Level));
  
  // 光照强度计算
  let lightIntensity = 0;
  if (isDay) {
    // 自然光照（受云量影响）
    const naturalLight = defaultParams.baseLightIntensity * (1 - cloudCover) * lightTransmission * Math.sin((hour - 6) * Math.PI / 12);
    // 补光系统
    const artificialLight = controlEffects.lighting * 25;
    lightIntensity = naturalLight + artificialLight;
  } else {
    // 夜间只有补光系统
    lightIntensity = controlEffects.lighting * 25;
  }
  
  // 土壤相关参数
  const soilTemp = indoorTemp * 0.7 + temperature * 0.3;
  
  // 土壤湿度，受灌溉系统影响
  let soilMoisture = defaultParams.baseHumidity;
  soilMoisture += controlEffects.irrigation * 0.3;
  soilMoisture += precipitation * 0.5 * (1 - airTightness);
  soilMoisture = Math.max(50, Math.min(95, soilMoisture));
  
  // 返回计算的大棚环境参数
  return {
    timestamp: Date.now(),
    airTemperature: Number(indoorTemp.toFixed(2)),
    airHumidity: Number(indoorHumidity.toFixed(2)),
    co2Level: Number(co2Level.toFixed(2)),
    lightIntensity: Number(lightIntensity.toFixed(2)),
    soilTemperature: Number(soilTemp.toFixed(2)),
    soilMoisture: Number(soilMoisture.toFixed(2)),
    soilPH: 6.5 + (Math.random() - 0.5) * 0.1,
    ec: 1.2 + (Math.random() - 0.5) * 0.1,
    weather: weatherData.weatherType,
    outdoorTemperature: temperature,
    outdoorHumidity: humidity,
    precipitation: precipitation,
    windSpeed: windSpeed,
    description: weatherData.description
  };
};

/**
 * 传统模拟方法 - 基于正弦波和随机数生成环境数据
 */
export const simulateEnvironment = async () => {
  if (weatherDataDriven) {
    try {
      // 获取天气数据
      const weatherData = await getWeatherData();
      
      // 基于天气数据计算大棚内环境
      return calculateIndoorEnvironment(weatherData, controlEffects);
    } catch (error) {
      console.error('天气数据获取失败，使用传统模拟:', error);
      // 出错时回退到传统方法
      return simulateTraditional();
    }
  } else {
    // 使用传统模拟方法
    return simulateTraditional();
  }
};

/**
 * 传统模拟方法 - 保留原来的逻辑
 */
const simulateTraditional = () => {
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
    timestamp: Date.now(),
    airTemperature: Number(temperature.toFixed(2)),
    airHumidity: Number(Math.min(100, Math.max(0, humidity)).toFixed(2)),
    soilMoisture: Number(soilMoisture.toFixed(2)),
    soilTemperature: Number(soilTemperature.toFixed(2)),
    co2Level: Number(co2.toFixed(2)),
    lightIntensity: Number(lightIntensity.toFixed(2)),
    soilPH: Number(soilPH.toFixed(2)),
    ec: Number(ec.toFixed(2)),
    weather: weather.type,
    outdoorTemperature: Number((temperature - 3).toFixed(2)),
    outdoorHumidity: Number(Math.min(100, Math.max(0, humidity - 5)).toFixed(2)),
    precipitation: weather.precipitation,
    windSpeed: Math.random() * 5 + 1,
    description: `模拟${weather.type}`
  };
}; 