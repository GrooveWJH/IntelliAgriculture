import { openDB, DBSchema, IDBPDatabase } from 'idb';

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

interface WarningLog {
  timestamp: number;
  parameter: string;
  value: number;
  message: string;
  level: string;
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
  LAST_5_MIN: 5 * 60 * 1000,    // Keep all data from last 5 minutes
  LAST_HOUR: 60 * 60 * 1000,    // Keep data every 5 seconds for the last hour
  LAST_24_HOURS: 24 * 60 * 60 * 1000,  // Keep data every minute for last 24 hours
  OLDER: Infinity,              // Keep data every 5 minutes for older data
};

const SAMPLING_INTERVALS = {
  LAST_HOUR: 5000,             // 5 seconds
  LAST_24_HOURS: 60000,        // 1 minute
  OLDER: 300000,               // 5 minutes
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
      
      if (age <= RETENTION_POLICIES.LAST_5_MIN) {
        // Keep all data from last 5 minutes
        shouldDelete = false;
      } else if (age <= RETENTION_POLICIES.LAST_HOUR) {
        // Keep data every 5 seconds for the last hour
        shouldDelete = cursor.value.timestamp % SAMPLING_INTERVALS.LAST_HOUR !== 0;
      } else if (age <= RETENTION_POLICIES.LAST_24_HOURS) {
        // Keep data every minute for last 24 hours
        shouldDelete = cursor.value.timestamp % SAMPLING_INTERVALS.LAST_24_HOURS !== 0;
      } else {
        // Keep data every 5 minutes for older data
        shouldDelete = cursor.value.timestamp % SAMPLING_INTERVALS.OLDER !== 0;
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
    const mockData: SensorData = {
      timestamp: now,
      airTemperature: 22 + Math.random() * 3,
      airHumidity: 65 + Math.random() * 5,
      soilMoisture: 75 + Math.random() * 5,
      soilTemperature: 20 + Math.random() * 2,
      co2Level: 600 + Math.random() * 100,
      lightIntensity: 2000 + Math.random() * 500,
      soilPH: 7.0 + Math.random() * 0.5,
      ec: 1.3 + Math.random() * 0.2,
    };
    return [mockData];
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
    const mockData: SensorData[] = [];
    let time = startTime;
    while (time <= endTime) {
      mockData.push({
        timestamp: time,
        airTemperature: 22 + Math.random() * 3,
        airHumidity: 65 + Math.random() * 5,
        soilMoisture: 75 + Math.random() * 5,
        soilTemperature: 20 + Math.random() * 2,
        co2Level: 600 + Math.random() * 100,
        lightIntensity: 2000 + Math.random() * 500,
        soilPH: 7.0 + Math.random() * 0.5,
        ec: 1.3 + Math.random() * 0.2,
      });
      time += 60000; // Add a data point every minute
    }
    return mockData;
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