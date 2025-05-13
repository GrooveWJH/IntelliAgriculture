import React, { createContext, useContext, useState, useEffect } from 'react';
import { timeSeriesStorage } from '../services/TimeSeriesStorage';
import { 
  generateSensorData, 
  defaultWaveConfig, 
  SensorWaveConfig, 
  setTimeOffset,
  generateSensorDataSeries 
} from '../utils/sensorDataGenerator';

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
  setSimulationTimeOffset: () => {}
});

export const SensorDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [waveConfig, setWaveConfig] = useState<SensorWaveConfig>(defaultWaveConfig);

  // 每秒更新数据
  useEffect(() => {
    const updateInterval = setInterval(() => {
      try {
        const newData = generateSensorData(waveConfig);
        timeSeriesStorage.addData(newData);
        setSensorData(newData);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update sensor data'));
      }
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [waveConfig]);

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
        setSimulationTimeOffset: handleSetTimeOffset
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