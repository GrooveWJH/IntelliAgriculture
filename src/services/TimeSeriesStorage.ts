import { SensorData } from '../types/sensor';

interface StorageStats {
  totalPoints: number;
  dbSize: number;
  oldestData: number;
  newestData: number;
}

class TimeSeriesStorage {
  private static instance: TimeSeriesStorage;
  private data: Map<number, SensorData>;
  private maxSize: number = 100 * 1024 * 1024; // 100MB

  private constructor() {
    this.data = new Map();
  }

  public static getInstance(): TimeSeriesStorage {
    if (!TimeSeriesStorage.instance) {
      TimeSeriesStorage.instance = new TimeSeriesStorage();
    }
    return TimeSeriesStorage.instance;
  }

  public addData(data: SensorData): void {
    // 根据时间范围确定是否需要存储
    if (this.shouldStore(data.timestamp)) {
      this.data.set(data.timestamp, data);
      this.maintainDatabaseSize();
    }
  }

  private shouldStore(timestamp: number): boolean {
    const currentTime = Date.now();
    const age = currentTime - timestamp;

    // 5分钟内：每5秒存储一条数据
    if (age <= 5 * 60 * 1000) return timestamp % (5 * 1000) === 0;
    // 1小时内：每30秒存储
    if (age <= 60 * 60 * 1000) return timestamp % (30 * 1000) === 0;
    // 1天内：每5分钟存储
    if (age <= 24 * 60 * 60 * 1000) return timestamp % (5 * 60 * 1000) === 0;
    // 1月内：每30分钟存储
    if (age <= 30 * 24 * 60 * 60 * 1000) return timestamp % (30 * 60 * 1000) === 0;

    return false;
  }

  private maintainDatabaseSize(): void {
    const currentSize = this.calculateDatabaseSize();
    
    // 降低最大数据库大小，以减少内存占用
    if (currentSize > this.maxSize * 0.8) {
      // 当数据库大小超过阈值的80%时，删除最旧的20%数据
      const sortedTimestamps = Array.from(this.data.keys()).sort();
      const deleteCount = Math.floor(sortedTimestamps.length * 0.2);
      
      for (let i = 0; i < deleteCount && i < sortedTimestamps.length; i++) {
        this.data.delete(sortedTimestamps[i]);
      }
    }
  }

  private calculateDatabaseSize(): number {
    // 估算数据大小，每个数据点约250字节
    return this.data.size * 250;
  }

  public getData(startTime: number, endTime: number): SensorData[] {
    return Array.from(this.data.entries())
      .filter(([timestamp]) => timestamp >= startTime && timestamp <= endTime)
      .map(([, data]) => data)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  public getStats(): StorageStats {
    const timestamps = Array.from(this.data.keys()).sort();
    return {
      totalPoints: this.data.size,
      dbSize: this.calculateDatabaseSize(),
      oldestData: timestamps[0] || 0,
      newestData: timestamps[timestamps.length - 1] || 0
    };
  }

  public cleanupDataBefore(beforeTimestamp: number): void {
    Array.from(this.data.keys()).forEach(timestamp => {
      if (timestamp < beforeTimestamp) {
        this.data.delete(timestamp);
      }
    });
  }
}

// 导出单例实例
export const timeSeriesStorage = TimeSeriesStorage.getInstance(); 