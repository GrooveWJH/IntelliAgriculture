import React, { createContext, useContext, useState, useEffect } from 'react';
import { timeSeriesStorage } from '../services/TimeSeriesStorage';

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
});

// 模拟传感器数据生成
const generateSensorData = (): SensorData => {
  return {
    timestamp: Date.now(),
    airTemperature: Number((20 + Math.random() * 10).toFixed(2)),
    airHumidity: Number((60 + Math.random() * 20).toFixed(2)),
    soilMoisture: Number((70 + Math.random() * 15).toFixed(2)),
    soilTemperature: Number((18 + Math.random() * 8).toFixed(2)),
    co2Level: Number((400 + Math.random() * 200).toFixed(2)),
    lightIntensity: Number((2000 + Math.random() * 1000).toFixed(2)),
    soilPH: Number((6.5 + Math.random()).toFixed(2)),
    ec: Number((1.2 + Math.random() * 0.5).toFixed(2)),
  };
};

export const SensorDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 每秒更新数据
  useEffect(() => {
    const updateInterval = setInterval(() => {
      try {
        const newData = generateSensorData();
        timeSeriesStorage.addData(newData);
        setSensorData(newData);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update sensor data'));
      }
    }, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  const getHistoricalData = (startTime: number, endTime: number): SensorData[] => {
    return timeSeriesStorage.getData(startTime, endTime);
  };

  const getStorageStats = () => {
    return timeSeriesStorage.getStats();
  };

  const cleanupOldData = (beforeTimestamp: number) => {
    timeSeriesStorage.cleanupDataBefore(beforeTimestamp);
  };

  return (
    <SensorDataContext.Provider 
      value={{ 
        sensorData, 
        isLoading, 
        error,
        getHistoricalData,
        getStorageStats,
        cleanupOldData
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