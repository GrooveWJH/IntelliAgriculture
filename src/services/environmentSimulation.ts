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
let previousIndoorTemperature: number | null = null; //  新增：存储上一时刻的室内温度

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
  const { thermalInsulation, lightTransmission, airTightness, volume } = greenhouseProps;
  
  // 温度计算，考虑保温性和控制系统
  // 使用上一时刻的室内温度作为基础（如果存在），否则使用室外温度
  let indoorTemp = previousIndoorTemperature !== null ? previousIndoorTemperature : temperature;
  
  // 热量变化率 (dT/dt)
  let deltaT = 0;

  // 1. 与室外的热交换 (受保温性和温差影响)
  const heatLossToOutside = (indoorTemp - temperature) * (1 - thermalInsulation) * 0.1; // 调整系数
  deltaT -= heatLossToOutside;

  // 2. 控制系统影响
  // 加热器功率转换为温度上升速率 (假设每10%功率增加0.02 °C/min，可调整)
  deltaT += (controlEffects.heating / 100) * 0.5; // 调整加热效果
  // 制冷器功率转换为温度下降速率
  deltaT -= (controlEffects.cooling / 100) * 0.6; // 调整制冷效果
  // 通风系统影响 (引入空气交换率，受风速和通风功率影响)
  const airExchangeRate = (controlEffects.ventilation / 100) * (windSpeed / 10) * 0.2; // 调整通风效果
  deltaT -= (indoorTemp - temperature) * airExchangeRate;
  
  // 3. 阳光效应（晴天增加温度）
  const solarRadiationFactor = 5; // 太阳辐射基础因子
  const solarEffect = (1 - cloudCover) * solarRadiationFactor * lightTransmission;
  
  const hour = dayjs().hour();
  const isDay = hour >= 6 && hour <= 18;
  if (isDay) {
    const solarHeightFactor = Math.sin(Math.max(0, (hour - 6)) * Math.PI / 12); // 确保只在白天有正值
    deltaT += solarEffect * solarHeightFactor * 0.1; // 调整太阳辐射效果
  }

  // 更新室内温度 (假设更新间隔为3秒，即0.05分钟)
  // dT = (P_in - P_out) / (mass * specific_heat) 
  // 简化：直接调整温度，deltaT 代表单位时间内的温度变化量
  // 这里的更新逻辑可以更复杂，例如考虑大棚的热容量等
  // 简化的模拟，我们将 deltaT 视为一个调整速率
  indoorTemp += deltaT * 0.5; // 调整此系数以控制温度变化速度

  // 防止温度极端化，确保在一个合理范围内
  indoorTemp = Math.max(temperature -10, Math.min(temperature + 25, indoorTemp)); // 室内温度不会比室外低10度或高25度以上（极端情况）
  previousIndoorTemperature = indoorTemp; // 更新上一时刻的室内温度
  
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
    const naturalLightBase = 80000; // 晴天中午最大光照强度 (lux)
    const naturalLight = naturalLightBase * (1 - cloudCover) * lightTransmission * Math.sin(Math.max(0,(hour - 6)) * Math.PI / 12);
    // 补光系统
    const artificialLight = controlEffects.lighting * 250; // 每1%功率增加250 lux
    lightIntensity = naturalLight + artificialLight;
  } else {
    // 夜间只有补光系统
    lightIntensity = controlEffects.lighting * 250;
  }
  lightIntensity = Math.max(0, lightIntensity); // 确保光照不为负
  
  // 土壤相关参数
  const soilTempFactor = 0.05; // 土壤温度变化速率因子
  let currentSoilTemp = previousIndoorTemperature !== null ? previousIndoorTemperature * 0.8 : temperature; // 初始化土壤温度
  currentSoilTemp = currentSoilTemp + (indoorTemp - currentSoilTemp) * soilTempFactor; // 土壤温度缓慢跟随空气温度
  
  // 土壤湿度，受灌溉系统影响
  let soilMoisture = defaultParams.baseHumidity; // 基础值可以调整
  soilMoisture += (controlEffects.irrigation / 100) * 20; // 每1%功率增加0.2%湿度，最大增加20%
  soilMoisture += precipitation * 0.5 * (1 - airTightness); // 降雨影响
  // 蒸发影响，简化处理
  soilMoisture -= (indoorTemp / 30) * 0.5; // 温度越高，蒸发越快
  soilMoisture = Math.max(20, Math.min(95, soilMoisture));
  
  // 返回计算的大棚环境参数
  return {
    timestamp: Date.now(),
    airTemperature: Number(indoorTemp.toFixed(2)),
    airHumidity: Number(indoorHumidity.toFixed(2)),
    co2Level: Number(co2Level.toFixed(2)),
    lightIntensity: Number(lightIntensity.toFixed(2)),
    soilTemperature: Number(currentSoilTemp.toFixed(2)), // 使用更新后的土壤温度
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
  const weather = updateWeather(); //  获取模拟天气状况
  const isDay = hour >= 6 && hour <= 18;

  // 温度日变化：基础温度 + 日变化幅度 + 天气影响 + 控制系统影响
  let temperature = 
    defaultParams.baseTemperature + 
    defaultParams.temperatureAmplitude * Math.sin((hour - 6) * Math.PI / 12) +
    weather.temperature;
  
  temperature += (controlEffects.heating / 100) * 5; // 加热效果，每1%功率增加0.05度 (可调)
  temperature -= (controlEffects.cooling / 100) * 6; // 制冷效果
  temperature -= (controlEffects.ventilation / 100) * (temperature - (defaultParams.baseTemperature - 5)) * 0.1; // 通风降温，温度越高于室外基准降温越快
  
  // 湿度：基础湿度 + 天气影响 - 温度影响 + 控制系统影响
  let humidity = 
    defaultParams.baseHumidity + 
    weather.humidity - 
    (temperature - defaultParams.baseTemperature) * 0.5;
  
  humidity += (controlEffects.humidification / 100) * 15; // 加湿效果
  humidity -= (controlEffects.dehumidification / 100) * 15; // 除湿效果
  humidity -= (controlEffects.ventilation / 100) * 5; // 通风除湿

  humidity = Math.min(100, Math.max(20, humidity)); // 湿度范围
  
  // CO2浓度：基础浓度 + 光合作用影响 + 控制系统影响
  let co2 = 
    defaultParams.baseCO2 + 
    defaultParams.co2Variation * Math.sin((hour - 12) * Math.PI / 12); // 自然波动
  
  if(isDay) {
    co2 -= defaultParams.co2Variation * 0.5 * (1-weather.cloudCover); // 白天植物消耗
  } else {
    co2 += defaultParams.co2Variation * 0.2; // 夜间植物呼吸释放少量
  }
  co2 += (controlEffects.co2Injection / 100) * 200; // CO2注入效果
  co2 -= (controlEffects.ventilation / 100) * 100; // 通风降低CO2
  co2 = Math.max(300, Math.min(1500, co2)); // CO2范围

  // 光照强度：考虑时间和云量 + 控制系统影响
  let lightIntensity = 0;
  if (isDay) {
    lightIntensity = defaultParams.baseLightIntensity * 
                     (1 - weather.cloudCover) * 
                     Math.sin(Math.max(0,(hour - 6)) * Math.PI / 12);
  }
  lightIntensity += (controlEffects.lighting / 100) * 50000; // 补光灯效果，每1%功率增加500 lux (可调)
  lightIntensity = Math.max(0, lightIntensity);
  
  // 土壤相关参数变化较慢
  const soilTemperature = temperature * 0.8 + defaultParams.baseTemperature * 0.2; // 简单跟随空气温度
  let soilMoisture = defaultParams.baseHumidity * 0.8; // 土壤湿度基础值
  soilMoisture += (controlEffects.irrigation / 100) * 15; // 灌溉效果
  soilMoisture += weather.precipitation * 1; // 降雨少量增加土壤湿度
  soilMoisture -= (temperature / 30) * 0.3; // 高温蒸发
  soilMoisture = Math.min(90, Math.max(30, soilMoisture)); // 土壤湿度范围

  const soilPH = 6.5 + (Math.random() - 0.5) * 0.1; // 随机pH
  const ec = 1.2 + (Math.random() - 0.5) * 0.1;    // 随机EC
  
  return {
    timestamp: Date.now(),
    airTemperature: Number(temperature.toFixed(2)),
    airHumidity: Number(humidity.toFixed(2)),
    soilMoisture: Number(soilMoisture.toFixed(2)),
    soilTemperature: Number(soilTemperature.toFixed(2)),
    co2Level: Number(co2.toFixed(2)),
    lightIntensity: Number(lightIntensity.toFixed(2)),
    soilPH: Number(soilPH.toFixed(2)),
    ec: Number(ec.toFixed(2)),
    weather: weather.type,
    outdoorTemperature: Number((weather.temperature + defaultParams.baseTemperature - 3).toFixed(2)), // 模拟一个室外温度
    outdoorHumidity: Number(Math.min(100, Math.max(0, weather.humidity + defaultParams.baseHumidity - 5)).toFixed(2)), // 模拟室外湿度
    precipitation: weather.precipitation,
    windSpeed: Math.random() * 5 + 1, // 随机风速
    description: `传统模拟 - ${weather.type}`
  };
}; 