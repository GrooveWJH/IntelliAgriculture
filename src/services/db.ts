import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { 
  SensorData,
} from '../contexts/SensorDataContext';
import { 
  generateSensorData, 
  generateSensorDataSeries 
} from '../utils/sensorDataGenerator';

export interface WarningLog {
  timestamp: number;
  parameter: string;
  value: number;
  threshold: number;
  message: string;
  level: 'info' | 'warning' | 'critical';
}

interface FarmDB extends DBSchema {
  sensorData: {
    key: number;
    value: SensorData;
    indexes: {
      'by-timestamp': number;
    };
  };
  warningLogs: {
    key: number;
    value: WarningLog;
    indexes: {
      'by-timestamp': number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<FarmDB>>;

const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<FarmDB>('farm-db', 1, {
      upgrade(db) {
        const sensorStore = db.createObjectStore('sensorData', {
          keyPath: 'timestamp',
        });
        sensorStore.createIndex('by-timestamp', 'timestamp');

        const warningStore = db.createObjectStore('warningLogs', {
          keyPath: 'timestamp',
        });
        warningStore.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
};

// Data retention configuration
const RETENTION_POLICIES = {
  LAST_HOUR: 60 * 60 * 1000,         // 1小时
  LAST_DAY: 24 * 60 * 60 * 1000,     // 1天
  LAST_WEEK: 7 * 24 * 60 * 60 * 1000 // 1周
};

const SAMPLING_INTERVALS = {
  LAST_HOUR: 5000,   // 5秒
  LAST_DAY: 60000,   // 1分钟
  OLDER: 300000      // 5分钟
};

// Clean up old data based on retention policies
const cleanupOldData = async () => {
  const db = await initDB();
  const now = Date.now();
  const stores = ['sensorData', 'warningLogs'] as const;

  for (const storeName of stores) {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.store;
    const index = store.index('by-timestamp');
    
    // Get all records
    let cursor = await index.openCursor();
    const toDelete: number[] = [];
    
    while (cursor) {
      const age = now - cursor.value.timestamp;
      let shouldDelete = false;
      
      if (age <= RETENTION_POLICIES.LAST_HOUR) {
        // Keep all data from last 5 seconds for the last hour
        shouldDelete = cursor.value.timestamp % SAMPLING_INTERVALS.LAST_HOUR !== 0;
      } else if (age <= RETENTION_POLICIES.LAST_DAY) {
        // Keep data every minute for last 24 hours
        shouldDelete = cursor.value.timestamp % SAMPLING_INTERVALS.LAST_DAY !== 0;
      } else if (age <= RETENTION_POLICIES.LAST_WEEK) {
        // Keep data every 5 minutes for older data
        shouldDelete = cursor.value.timestamp % SAMPLING_INTERVALS.OLDER !== 0;
      } else {
        // Keep data every 5 minutes for older data
        shouldDelete = true;
      }
      
      if (shouldDelete) {
        toDelete.push(cursor.value.timestamp);
      }
      
      cursor = await cursor.continue();
    }
    
    // Delete filtered records
    for (const key of toDelete) {
      await store.delete(key);
    }
    
    await tx.done;
  }
};

// Save sensor data with automatic cleanup
export const saveSensorData = async (data: SensorData): Promise<void> => {
  const db = await initDB();
  await db.put('sensorData', data);
  
  // Run cleanup every 100 saves
  if (Math.random() < 0.01) {
    await cleanupOldData();
  }
};

// Save warning log with automatic cleanup
export const saveWarningLog = async (log: WarningLog): Promise<void> => {
  const db = await initDB();
  await db.put('warningLogs', log);
  
  // Run cleanup every 100 saves
  if (Math.random() < 0.01) {
    await cleanupOldData();
  }
};

// Get latest sensor data with time range
export const getLatestSensorData = async (timeRange: number = 300000): Promise<SensorData[]> => {
  const db = await initDB();
  const now = Date.now();
  const tx = db.transaction('sensorData', 'readonly');
  const index = tx.store.index('by-timestamp');
  
  const data = await index.getAll(IDBKeyRange.lowerBound(now - timeRange));
  await tx.done;
  
  // Generate mock data if no data exists
  if (data.length === 0) {
    // 使用新的基于三角函数的数据生成器
    return [generateSensorData()];
  }
  
  return data.sort((a, b) => a.timestamp - b.timestamp);
};

// Get sensor data in time range
export const getSensorDataInTimeRange = async (startTime: number, endTime: number): Promise<SensorData[]> => {
  const db = await initDB();
  const tx = db.transaction('sensorData', 'readonly');
  const index = tx.store.index('by-timestamp');
  const range = IDBKeyRange.bound(startTime, endTime);
  
  const data = await index.getAll(range);
  await tx.done;
  
  // Generate mock data if no data exists
  if (data.length === 0) {
    // 使用新的基于三角函数的数据序列生成器
    return generateSensorDataSeries(startTime, endTime, 60000);
  }
  
  return data.sort((a, b) => a.timestamp - b.timestamp);
};

// Get warning logs with time range
export const getWarningLogs = async (timeRange: number = 86400000): Promise<WarningLog[]> => {
  const db = await initDB();
  const now = Date.now();
  const tx = db.transaction('warningLogs', 'readonly');
  const index = tx.store.index('by-timestamp');
  
  const logs = await index.getAll(IDBKeyRange.lowerBound(now - timeRange));
  await tx.done;
  return logs;
};

// Estimate database size
export const getDBSize = async () => {
  const db = await initDB();
  const stores = ['sensorData', 'warningLogs'] as const;
  let totalSize = 0;
  
  for (const storeName of stores) {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.store;
    let cursor = await store.openCursor();
    
    while (cursor) {
      totalSize += JSON.stringify(cursor.value).length;
      cursor = await cursor.continue();
    }
    
    await tx.done;
  }
  
  return totalSize;
};

// Initialize database
initDB().catch(console.error); 