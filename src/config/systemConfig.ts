// 环境参数配置
export const environmentConfig = {
  airTemperature: {
    min: 20,
    max: 30,
    target: 25,
    warningThreshold: 30,
    criticalThreshold: 35,
    controlGain: 0.2,  // PID控制增益
    integralTime: 300, // 积分时间（秒）
    derivativeTime: 60 // 微分时间（秒）
  },
  airHumidity: {
    min: 60,
    max: 80,
    target: 70,
    warningThreshold: 80,
    criticalThreshold: 85,
    controlGain: 0.15,
    integralTime: 400,
    derivativeTime: 80
  },
  soilMoisture: {
    min: 70,
    max: 85,
    target: 75,
    warningThreshold: 85,
    criticalThreshold: 90,
    controlGain: 0.1,
    integralTime: 600,
    derivativeTime: 120
  },
  co2Level: {
    min: 400,
    max: 800,
    target: 600,
    warningThreshold: 800,
    criticalThreshold: 1000,
    controlGain: 0.25,
    integralTime: 240,
    derivativeTime: 45
  },
  lightIntensity: {
    min: 2000,
    max: 3000,
    target: 2500,
    warningThreshold: 3000,
    criticalThreshold: 3500,
    controlGain: 0.3,
    integralTime: 180,
    derivativeTime: 30
  }
};

// 系统响应配置
export const systemConfig = {
  updateIntervals: {
    sensorData: 1000,    // 传感器数据更新间隔（毫秒）
    systemStatus: 5000,  // 系统状态更新间隔（毫秒）
    controlLoop: 1000    // 控制循环间隔（毫秒）
  },
  powerControl: {
    minStep: 1,          // 最小调节步长（%）
    maxStep: 10,         // 最大调节步长（%）
    rampRate: 5          // 功率变化斜率限制（%/秒）
  },
  storage: {
    maxSize: 100 * 1024 * 1024,  // 数据库最大大小（字节）
    cleanupPeriod: 7 * 24 * 60 * 60 * 1000,  // 数据清理周期（毫秒）
    samplingIntervals: {
      lastMinute: 1,     // 1秒
      lastHour: 60,      // 1分钟
      lastDay: 1800,     // 30分钟
      lastMonth: 3600    // 1小时
    }
  }
};

// 控制模型配置
export const controlModelConfig = {
  pid: {
    defaultKp: 0.2,  // 比例系数
    defaultKi: 0.05, // 积分系数
    defaultKd: 0.1,  // 微分系数
    maxIntegral: 100 // 积分限幅
  },
  fuzzy: {
    membershipRanges: {
      error: [-10, -5, 0, 5, 10],
      errorChange: [-2, -1, 0, 1, 2]
    },
    rules: [
      // 模糊规则矩阵
      [0.0, 0.2, 0.4, 0.6, 0.8],
      [0.2, 0.4, 0.6, 0.8, 1.0],
      [0.4, 0.6, 0.8, 1.0, 0.8],
      [0.6, 0.8, 1.0, 0.8, 0.6],
      [0.8, 1.0, 0.8, 0.6, 0.4]
    ]
  },
  smith: {
    deadTime: 5,        // 系统死区时间（秒）
    timeConstant: 30,   // 系统时间常数（秒）
    modelGain: 1.2      // 模型增益
  }
}; 