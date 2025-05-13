import React, { createContext, useContext, useState, useEffect } from 'react';
import { timeSeriesStorage } from '../services/TimeSeriesStorage';
import { 
  generateSensorData, 
  defaultWaveConfig, 
  SensorWaveConfig, 
  setTimeOffset,
  generateSensorDataSeries 
} from '../utils/sensorDataGenerator';
import {
  simulateEnvironment,
  setControlEffects,
  getControlEffects,
  setGreenhouseProperties,
  getGreenhouseProperties,
  isWeatherDataDriven,
  setWeatherDataDriven,
  GreenhouseProperties
} from '../services/environmentSimulation';
import { weatherService } from '../services/WeatherDataService';

// 定义传感器数据类型
export interface SensorData {
  timestamp: number;
  airTemperature: number;
  airHumidity: number;
  soilMoisture: number;
  soilTemperature: number;
  co2Level: number;
  lightIntensity: number;
  soilPH: number;
  ec: number;
  weather?: string;
  outdoorTemperature?: number;
  outdoorHumidity?: number;
  precipitation?: number;
  windSpeed?: number;
  description?: string;
}

// 定义上下文类型
interface SensorDataContextType {
  sensorData: SensorData | null;
  isLoading: boolean;
  error: Error | null;
  getHistoricalData: (startTime: number, endTime: number) => SensorData[];
  getStorageStats: () => {
    totalPoints: number;
    dbSize: number;
    oldestData: number;
    newestData: number;
  };
  cleanupOldData: (beforeTimestamp: number) => void;
  setWaveConfig: (config: SensorWaveConfig) => void;
  currentWaveConfig: SensorWaveConfig;
  setSimulationTimeOffset: (offset: number) => void;
  isWeatherDriven: boolean;
  setWeatherDriven: (enabled: boolean) => void;
  setControlSystemEffect: (system: string, power: number) => void;
  setGreenhouseProps: (props: Partial<GreenhouseProperties>) => void;
  greenhouseProperties: GreenhouseProperties;
  weatherLocation: string;
  setWeatherLocation: (location: string) => void;
}

const SensorDataContext = createContext<SensorDataContextType>({
  sensorData: null,
  isLoading: true,
  error: null,
  getHistoricalData: () => [],
  getStorageStats: () => ({
    totalPoints: 0,
    dbSize: 0,
    oldestData: 0,
    newestData: 0,
  }),
  cleanupOldData: () => {},
  setWaveConfig: () => {},
  currentWaveConfig: defaultWaveConfig,
  setSimulationTimeOffset: () => {},
  isWeatherDriven: true,
  setWeatherDriven: () => {},
  setControlSystemEffect: () => {},
  setGreenhouseProps: () => {},
  greenhouseProperties: getGreenhouseProperties(),
  weatherLocation: '116.3883,39.9289',
  setWeatherLocation: () => {}
});

export const SensorDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [waveConfig, setWaveConfig] = useState<SensorWaveConfig>(defaultWaveConfig);
  const [weatherDriven, setWeatherDriven] = useState<boolean>(isWeatherDataDriven());
  const [location, setLocation] = useState<string>('116.3883,39.9289');

  // 更新控制系统效果
  const handleSetControlSystemEffect = (system: string, power: number) => {
    const effects = getControlEffects();
    const newEffects = { ...effects, [system]: power };
    setControlEffects(newEffects);
  };

  // 更新大棚物理属性
  const handleSetGreenhouseProps = (props: Partial<GreenhouseProperties>) => {
    setGreenhouseProperties(props);
  };

  // 设置天气驱动模式
  const handleSetWeatherDriven = (enabled: boolean) => {
    setWeatherDriven(enabled);
    setWeatherDataDriven(enabled);
  };

  // 设置天气位置
  const handleSetWeatherLocation = (newLocation: string) => {
    setLocation(newLocation);
    weatherService.setLocation(newLocation);
  };

  // 每秒更新数据
  useEffect(() => {
    const updateInterval = setInterval(async () => {
      try {
        let newData: SensorData;
        
        if (weatherDriven) {
          // 使用天气驱动的环境模拟
          newData = await simulateEnvironment();
        } else {
          // 使用传统的三角函数生成器
          newData = generateSensorData(waveConfig);
        }
        
        // 只有当时间戳为5秒的倍数时才存储数据，减少数据库压力
        if (Math.round(Date.now() / 1000) % 5 === 0) {
        timeSeriesStorage.addData(newData);
        }
        
        setSensorData(newData);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('获取传感器数据失败'));
      }
    }, 3000); // 从1秒改为3秒

    return () => clearInterval(updateInterval);
  }, [waveConfig, weatherDriven]);

  // 初始化时设置天气服务位置
  useEffect(() => {
    weatherService.setLocation(location);
  }, [location]);

  const getHistoricalData = (startTime: number, endTime: number): SensorData[] => {
    const storedData = timeSeriesStorage.getData(startTime, endTime);
    
    // 如果没有存储的数据，生成模拟数据
    if (storedData.length === 0) {
      return generateSensorDataSeries(startTime, endTime, 60000, waveConfig);
    }
    
    return storedData;
  };

  const getStorageStats = () => {
    return timeSeriesStorage.getStats();
  };

  const cleanupOldData = (beforeTimestamp: number) => {
    timeSeriesStorage.cleanupDataBefore(beforeTimestamp);
  };

  const handleSetWaveConfig = (config: SensorWaveConfig) => {
    setWaveConfig(config);
  };

  const handleSetTimeOffset = (offset: number) => {
    setTimeOffset(offset);
  };

  return (
    <SensorDataContext.Provider 
      value={{ 
        sensorData, 
        isLoading, 
        error,
        getHistoricalData,
        getStorageStats,
        cleanupOldData,
        setWaveConfig: handleSetWaveConfig,
        currentWaveConfig: waveConfig,
        setSimulationTimeOffset: handleSetTimeOffset,
        isWeatherDriven: weatherDriven,
        setWeatherDriven: handleSetWeatherDriven,
        setControlSystemEffect: handleSetControlSystemEffect,
        setGreenhouseProps: handleSetGreenhouseProps,
        greenhouseProperties: getGreenhouseProperties(),
        weatherLocation: location,
        setWeatherLocation: handleSetWeatherLocation
      }}
    >
      {children}
    </SensorDataContext.Provider>
  );
};

export const useSensorData = () => {
  const context = useContext(SensorDataContext);
  if (!context) {
    throw new Error('useSensorData must be used within a SensorDataProvider');
  }
  return context;
}; 