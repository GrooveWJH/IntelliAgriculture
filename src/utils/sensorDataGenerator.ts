import { SensorData } from '../contexts/SensorDataContext';

// 波动参数配置接口
export interface WaveParams {
  baseValue: number;  // 基础值
  amplitude: number;  // 振幅
  period: number;     // 周期(毫秒)
  phase: number;      // 相位(弧度)
  noiseLevel: number; // 噪声级别(0-1)
}

// 所有环境参数的波动配置
export interface SensorWaveConfig {
  airTemperature: WaveParams;
  airHumidity: WaveParams;
  soilMoisture: WaveParams;
  soilTemperature: WaveParams;
  co2Level: WaveParams;
  lightIntensity: WaveParams;
  soilPH: WaveParams;
  ec: WaveParams;
}

// 默认配置参数
export const defaultWaveConfig: SensorWaveConfig = {
  airTemperature: {
    baseValue: 25,    // 基础温度25℃
    amplitude: 5,     // 振幅5℃
    period: 24 * 60 * 60 * 1000, // 24小时周期
    phase: 0,         // 无相位偏移
    noiseLevel: 0.1   // 10%的随机噪声
  },
  airHumidity: {
    baseValue: 70,    // 基础湿度70%
    amplitude: 10,    // 振幅10%
    period: 24 * 60 * 60 * 1000, // 24小时周期
    phase: Math.PI,   // 与温度相反的相位
    noiseLevel: 0.15  // 15%的随机噪声
  },
  soilMoisture: {
    baseValue: 75,    // 基础土壤湿度75%
    amplitude: 7,     // 振幅7%
    period: 48 * 60 * 60 * 1000, // 48小时周期
    phase: Math.PI / 4, // π/4相位偏移
    noiseLevel: 0.05  // 5%的随机噪声
  },
  soilTemperature: {
    baseValue: 22,    // 基础土壤温度22℃
    amplitude: 3,     // 振幅3℃
    period: 24 * 60 * 60 * 1000, // 24小时周期
    phase: Math.PI / 6, // π/6相位偏移
    noiseLevel: 0.05  // 5%的随机噪声
  },
  co2Level: {
    baseValue: 500,   // 基础CO2浓度500ppm
    amplitude: 100,   // 振幅100ppm
    period: 12 * 60 * 60 * 1000, // 12小时周期
    phase: 0,         // 无相位偏移
    noiseLevel: 0.2   // 20%的随机噪声
  },
  lightIntensity: {
    baseValue: 2500,  // 基础光照强度2500lux
    amplitude: 2500,  // 振幅2500lux（白天/黑夜变化）
    period: 24 * 60 * 60 * 1000, // 24小时周期
    phase: 0,         // 无相位偏移
    noiseLevel: 0.1   // 10%的随机噪声
  },
  soilPH: {
    baseValue: 7.0,   // 基础PH值7.0
    amplitude: 0.5,   // 振幅0.5
    period: 72 * 60 * 60 * 1000, // 72小时周期
    phase: 0,         // 无相位偏移
    noiseLevel: 0.02  // 2%的随机噪声（PH变化慢）
  },
  ec: {
    baseValue: 1.5,   // 基础电导率1.5 mS/cm
    amplitude: 0.3,   // 振幅0.3 mS/cm
    period: 48 * 60 * 60 * 1000, // 48小时周期
    phase: Math.PI / 3, // π/3相位偏移
    noiseLevel: 0.05  // 5%的随机噪声
  }
};

// 模拟时间偏移（可用于模拟调试）
let timeOffset = 0;

/**
 * 设置时间偏移，用于调试特定时间点的数据
 * @param offset 时间偏移量（毫秒）
 */
export const setTimeOffset = (offset: number): void => {
  timeOffset = offset;
};

/**
 * 获取当前时间（考虑偏移）
 * @returns 当前时间戳
 */
export const getCurrentTime = (): number => {
  return Date.now() + timeOffset;
};

/**
 * 根据三角函数生成波动值
 * @param params 波动参数
 * @param timestamp 时间戳
 * @returns 生成的值
 */
export const generateWaveValue = (params: WaveParams, timestamp: number): number => {
  const { baseValue, amplitude, period, phase, noiseLevel } = params;
  
  // 计算波动周期中的位置（0-2π）
  const position = (timestamp % period) / period * 2 * Math.PI;
  
  // 计算带相位的正弦值（-1到1）
  const sineValue = Math.sin(position + phase);
  
  // 添加随机噪声（乘以噪声级别）
  const noise = (Math.random() * 2 - 1) * noiseLevel;
  
  // 根据基础值、振幅、正弦值和噪声计算最终值
  const finalValue = baseValue + amplitude * sineValue + amplitude * noise;
  
  // 返回四舍五入到两位小数的值
  return Number(finalValue.toFixed(2));
};

/**
 * 生成带有时间变化模式的传感器数据
 * @param config 波动配置参数
 * @param timestamp 时间戳（可选，默认为当前时间）
 * @returns 生成的传感器数据
 */
export const generateSensorData = (
  config: SensorWaveConfig = defaultWaveConfig,
  timestamp: number = getCurrentTime()
): SensorData => {
  return {
    timestamp,
    airTemperature: generateWaveValue(config.airTemperature, timestamp),
    airHumidity: generateWaveValue(config.airHumidity, timestamp),
    soilMoisture: generateWaveValue(config.soilMoisture, timestamp),
    soilTemperature: generateWaveValue(config.soilTemperature, timestamp),
    co2Level: generateWaveValue(config.co2Level, timestamp),
    lightIntensity: generateWaveValue(config.lightIntensity, timestamp),
    soilPH: generateWaveValue(config.soilPH, timestamp),
    ec: generateWaveValue(config.ec, timestamp)
  };
};

/**
 * 生成指定时间范围内的传感器数据序列
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @param interval 时间间隔（毫秒）
 * @param config 波动配置参数
 * @returns 传感器数据数组
 */
export const generateSensorDataSeries = (
  startTime: number,
  endTime: number,
  interval: number = 60000, // 默认1分钟间隔
  config: SensorWaveConfig = defaultWaveConfig
): SensorData[] => {
  const series: SensorData[] = [];
  
  for (let timestamp = startTime; timestamp <= endTime; timestamp += interval) {
    series.push(generateSensorData(config, timestamp));
  }
  
  return series;
};

/**
 * 导出一个配置对象的克隆版本，用于修改
 * @returns 波动配置的深拷贝
 */
export const getConfigCopy = (): SensorWaveConfig => {
  return JSON.parse(JSON.stringify(defaultWaveConfig));
}; 