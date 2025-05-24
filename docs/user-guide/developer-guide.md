# 自然生态智慧农业大棚控制系统开发指南

本指南旨在帮助开发人员理解和扩展自然生态智慧农业大棚控制系统的功能。

## 1. 项目结构

项目遵循典型的 React 应用结构，使用 TypeScript 进行类型定义，主要包含以下目录：

```
src/
├── components/       # 可复用UI组件
├── contexts/         # React Context状态管理
├── hooks/            # 自定义React Hooks
├── models/           # TypeScript接口和类型定义
├── pages/            # 页面级组件
├── services/         # 业务逻辑和数据处理
├── styles/           # 全局样式和主题
├── utils/            # 工具函数
└── App.tsx           # 应用入口
```

## 2. 核心模块开发

### 2.1 传感器数据与存储

传感器数据是系统的核心，相关文件位于：

- `src/contexts/SensorDataContext.tsx` - 管理传感器数据的状态和更新
- `src/services/TimeSeriesStorage.ts` - 处理时序数据存储和查询

要添加新的传感器类型，需要：

```typescript
// 1. 在models/SensorData.ts中扩展接口
interface SensorData {
  // 现有字段
  timestamp: number;
  airTemperature: number;
  airHumidity: number;
  // 添加新传感器类型
  newSensorType: number;
}

// 2. 在SensorDataContext中更新生成函数
function generateSensorData(): SensorData {
  return {
    // 现有字段
    timestamp: Date.now(),
    airTemperature: generateRandomValue(20, 30),
    airHumidity: generateRandomValue(60, 80),
    // 添加新字段
    newSensorType: generateRandomValue(minValue, maxValue),
  };
}

// 3. 在UI组件中添加对应的显示
// 例如在components/SensorCard.tsx和components/SensorChart.tsx中
```

### 2.2 控制系统

控制系统相关代码位于：

- `src/pages/EnvironmentControl.tsx` - 控制系统UI和逻辑
- `src/services/ControlModels.ts` - 控制算法实现

添加新的控制系统需要：

```typescript
// 1. 在models/ControlSystem.ts中定义新系统
interface ControlSystem {
  id: string;
  name: string;
  description: string;
  effects: string[];
  isAuto: boolean;
  currentPower: number;
  targetParameter: keyof SensorData;
  warningThreshold?: number;
}

// 2. 在pages/EnvironmentControl.tsx中添加系统定义
const initialSystems: Record<string, ControlSystem> = {
  // 现有系统
  ventilation: { /* ... */ },
  humidifier: { /* ... */ },
  // 新系统
  newSystem: {
    id: 'newSystem',
    name: '新控制系统',
    description: '新系统的功能描述',
    effects: ['影响效果1', '影响效果2'],
    isAuto: true,
    currentPower: 0,
    targetParameter: 'newSensorType'
  }
};

// 3. 在services/ControlModels.ts中添加功率计算逻辑
function calculateNewSystemPower(
  system: ControlSystem,
  sensorData: SensorData
): number {
  if (!sensorData) return 0;
  
  const currentValue = sensorData[system.targetParameter] as number;
  const targetValue = /* 目标值 */;
  
  // 实现控制逻辑
  // 例如: PID控制、模糊控制等
  
  return calculatedPower;
}
```

### 2.3 UI组件开发

系统使用 Ant Design 组件库，新 UI 组件应遵循现有风格。

组件开发建议：

1. 创建独立的组件文件，放在 `src/components/` 目录下
2. 使用 TypeScript 接口定义 props
3. 遵循现有的样式约定
4. 添加必要的注释和文档

示例组件：

```typescript
// src/components/NewComponent.tsx
import React from 'react';
import { Card, Typography } from 'antd';
import styled from 'styled-components';

const { Text } = Typography;

interface NewComponentProps {
  title: string;
  value: number;
  unit: string;
  onValueChange?: (value: number) => void;
}

const StyledCard = styled(Card)`
  height: 100%;
  margin-bottom: 16px;
`;

export const NewComponent: React.FC<NewComponentProps> = ({
  title,
  value,
  unit,
  onValueChange
}) => {
  return (
    <StyledCard title={title}>
      <Text>{value} {unit}</Text>
      {/* 其他组件内容 */}
    </StyledCard>
  );
};
```

### 2.4 滑块交互优化

系统对所有滑块组件进行了交互优化，主要通过以下方法实现：

```typescript
// 优化后的滑块组件
const OptimizedSlider = styled(Slider)`
  // 移除所有动画效果，确保滑块和轨道同步移动
  &, .ant-slider-rail, .ant-slider-track, .ant-slider-handle {
    transition: none !important;
  }
  
  .ant-slider-rail {
    background-color: #f0f0f0;
    height: 8px;
  }
  
  .ant-slider-track {
    background-color: #91d5ff;
    height: 8px;
  }
  
  .ant-slider-handle {
    width: 16px;
    height: 16px;
    margin-top: -4px;
    background-color: white;
    border: 2px solid #1890ff;
    box-shadow: none;
    outline: none;
  }
`;

// 在组件中使用优化后的滑块
const SliderControl: React.FC<SliderControlProps> = ({ 
  value, 
  onChange, 
  disabled 
}) => {
  return (
    <OptimizedSlider
      value={value}
      onChange={onChange}
      disabled={disabled}
      min={0}
      max={100}
      // 也可以通过样式属性直接禁用过渡效果
      styles={{
        track: { transition: 'none' },
        rail: { transition: 'none' },
        handle: { transition: 'none' }
      }}
    />
  );
};
```

### 2.5 环境模拟引擎

环境模拟是系统的重要组成部分，最新版本支持两种模拟模式：

- `src/services/environmentSimulation.ts` - 环境模拟引擎核心代码

模拟引擎的主要特性：

1. **传统波形模式** - 基于三角函数生成环境参数
2. **天气驱动模式** - 基于物理模型和天气数据的高精度模拟

扩展环境模拟引擎：

```typescript
// 1. 在environmentSimulation.ts中添加新的物理模型计算
export interface PhysicalModel {
  calculateTemperature: (data: WeatherData, previous: number | null, effects: ControlEffects) => number;
  calculateHumidity: (data: WeatherData, previous: number | null, temperature: number, effects: ControlEffects) => number;
  calculateCO2: (data: WeatherData, previous: number | null, effects: ControlEffects) => number;
  // 添加新的计算函数
  calculateNewParameter: (data: WeatherData, previous: number | null, effects: ControlEffects) => number;
}

// 2. 实现新参数的计算逻辑
const calculateNewParameter = (
  weatherData: WeatherData, 
  previousValue: number | null,
  controlEffects: ControlEffects,
  deltaTime: number = 3000 // 默认3秒更新间隔
): number => {
  // 使用上一时刻的值作为基础
  let currentValue = previousValue !== null ? previousValue : DEFAULT_VALUE;
  
  // 计算变化率
  let deltaValue = 0;
  
  // 添加各种影响因素的计算
  // 1. 外部环境影响
  deltaValue += (weatherData.externalFactor - currentValue) * INFLUENCE_FACTOR;
  
  // 2. 控制系统影响
  deltaValue += controlEffects.relevantSystem * CONTROL_EFFECT_FACTOR * (deltaTime / 60000);
  
  // 应用变化率
  currentValue += deltaValue;
  
  // 限制变化率，确保平滑变化
  if (previousValue !== null) {
    currentValue = limitChangeRate(currentValue, previousValue, MAX_CHANGE_RATE, deltaTime);
  }
  
  // 确保值在合理范围内
  return Math.max(MIN_VALUE, Math.min(MAX_VALUE, currentValue));
};

// 3. 在主模拟函数中集成新参数的计算
export const calculateIndoorEnvironment = (weatherData: WeatherData, controlEffects: ControlEffects) => {
  // 现有参数计算
  const indoorTemp = calculateTemperature(weatherData, previousIndoorTemperature, controlEffects);
  previousIndoorTemperature = indoorTemp;
  
  const indoorHumidity = calculateHumidity(weatherData, previousIndoorHumidity, indoorTemp, controlEffects);
  previousIndoorHumidity = indoorHumidity;
  
  // 新参数计算
  const newParamValue = calculateNewParameter(weatherData, previousNewParamValue, controlEffects);
  previousNewParamValue = newParamValue;
  
  // 返回更新后的环境数据
  return {
    timestamp: Date.now(),
    airTemperature: Number(indoorTemp.toFixed(2)),
    airHumidity: Number(indoorHumidity.toFixed(2)),
    // 添加新参数
    newParameter: Number(newParamValue.toFixed(2))
  };
};
```

## 3. 扩展功能开发指南

### 3.1 添加新的数据分析功能

添加新数据分析功能，需要关注：

1. 数据处理和计算逻辑（放在 `src/services/` 中）
2. 数据可视化组件（使用 ECharts 或其他库）
3. UI 界面整合

步骤示例：

```typescript
// 1. 创建分析服务 src/services/NewAnalysisService.ts
export function analyzeData(
  data: SensorData[],
  options: AnalysisOptions
): AnalysisResult {
  // 实现分析算法
  return result;
}

// 2. 创建可视化组件 src/components/NewAnalysisChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

interface NewAnalysisChartProps {
  data: AnalysisResult;
}

export const NewAnalysisChart: React.FC<NewAnalysisChartProps> = ({ data }) => {
  const options = {
    // ECharts配置
  };
  
  return <ReactECharts option={options} />;
};

// 3. 整合到页面 src/pages/DataAnalysis.tsx
// 在现有的页面中添加新的分析选项和图表
```

### 3.2 添加外部数据源集成

系统可以扩展为连接外部数据源，例如真实传感器或第三方服务：

```typescript
// src/services/ExternalDataService.ts
export async function fetchExternalData(): Promise<SensorData> {
  try {
    // 实现API调用
    const response = await fetch('https://api.example.com/sensor-data');
    const data = await response.json();
  
    // 转换为系统使用的格式
    return {
      timestamp: Date.now(),
      airTemperature: data.temperature,
      airHumidity: data.humidity,
      // 其他字段
    };
  } catch (error) {
    console.error('Failed to fetch external data:', error);
    // 返回模拟数据作为后备
    return generateSensorData();
  }
}

// 在SensorDataContext中集成
useEffect(() => {
  const updateInterval = setInterval(async () => {
    try {
      // 使用外部数据或生成模拟数据
      const newData = useExternalData 
        ? await fetchExternalData() 
        : generateSensorData();
      
      timeSeriesStorage.addData(newData);
      setSensorData(newData);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update sensor data'));
    }
  }, updateInterval);

  return () => clearInterval(updateInterval);
}, [useExternalData]);
```

### 3.3 增强报警系统

系统的报警功能已增强，支持以下特性：

- **分级报警** - 环境参数与系统异常分开处理
- **参数级开关** - 每个参数都有独立的报警开关
- **延迟报警** - 超出阈值一定时间后才触发报警
- **多通知方式** - 支持界面、声音、邮件等多种通知方式

开发者可以通过以下方式扩展报警系统：

```typescript
// src/models/AlarmTypes.ts
// 定义报警阈值接口
export interface ParameterThreshold {
  enabled: boolean;       // 是否启用报警
  min: number;            // 最小阈值
  max: number;            // 最大阈值
  delay: number;          // 超出阈值延迟时间(秒)
  lastViolationTime?: number; // 上次违反阈值的时间
}

export interface AlarmSettings {
  enabled: boolean;                           // 系统总开关
  thresholds: Record<string, ParameterThreshold>; // 各参数阈值
  notificationMethod: string[];               // 通知方式
}

// src/services/AlarmService.ts
// 报警检测实现
export function checkAlarms(
  sensorData: SensorData,
  alarmSettings: AlarmSettings
): Alert[] {
  if (!alarmSettings.enabled) return []; // 总开关未启用
  
  const now = Date.now();
  const alerts: Alert[] = [];
  const thresholds = alarmSettings.thresholds;
  
  // 遍历所有需要监控的参数
  Object.keys(thresholds).forEach(param => {
    const threshold = thresholds[param];
    if (!threshold.enabled) return; // 参数报警未启用
    
    const value = sensorData[param as keyof SensorData] as number;
    if (!value) return; // 参数不存在
    
    const isOutOfRange = value < threshold.min || value > threshold.max;
    
    if (isOutOfRange) {
      // 记录首次违反阈值的时间
      if (!threshold.lastViolationTime) {
        threshold.lastViolationTime = now;
      }
      
      // 计算已违反阈值的时间(秒)
      const violationDuration = (now - threshold.lastViolationTime) / 1000;
      
      // 仅当超过延迟时间才触发报警
      if (violationDuration >= threshold.delay) {
        alerts.push({
          id: generateId(),
          parameterName: param,
          value: value,
          threshold: value < threshold.min ? threshold.min : threshold.max,
          type: value < threshold.min ? 'low' : 'high',
          timestamp: now,
          acknowledged: false
        });
      }
    } else {
      // 恢复正常，重置违反阈值时间
      threshold.lastViolationTime = undefined;
    }
  });
  
  return alerts;
}

// 在AlarmContext中使用
useEffect(() => {
  if (sensorData && alarmSettings) {
    const newAlerts = checkAlarms(sensorData, alarmSettings);
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 100));
      
      // 根据配置的通知方式处理报警
      newAlerts.forEach(alert => {
        // UI通知
        if (alarmSettings.notificationMethod.includes('ui')) {
          notification.warning({
            message: '系统警报',
            description: getAlertDescription(alert)
          });
        }
        
        // 声音通知
        if (alarmSettings.notificationMethod.includes('sound')) {
          playAlertSound(alert.type);
        }
        
        // 邮件通知
        if (alarmSettings.notificationMethod.includes('email')) {
          sendEmailAlert(alert);
        }
      });
    }
  }
}, [sensorData, alarmSettings]);
```

## 4. 测试与调试

### 4.1 添加单元测试

项目使用 Jest 进行测试，新功能应添加相应的测试：

```typescript
// src/services/__tests__/ControlModels.test.ts
import { calculateSystemPower } from '../ControlModels';

describe('Control Models', () => {
  test('calculateSystemPower should return correct power for ventilation system', () => {
    const system = {
      id: 'ventilation',
      name: '通风系统',
      targetParameter: 'airTemperature',
      isAuto: true,
      currentPower: 0
    };
  
    const sensorData = {
      timestamp: Date.now(),
      airTemperature: 32, // 高于警戒值
      airHumidity: 70
    };
  
    const power = calculateSystemPower(system, sensorData);
    expect(power).toBeGreaterThan(0); // 期望启动通风
    expect(power).toBeLessThanOrEqual(100); // 功率不应超过100%
  });
  
  // 添加更多测试...
});
```

### 4.2 环境模拟引擎测试

针对改进的环境模拟引擎，添加专门的测试用例：

```typescript
// src/services/__tests__/environmentSimulation.test.ts
import { 
  calculateIndoorEnvironment, 
  calculateTemperature,
  limitChangeRate
} from '../environmentSimulation';

describe('Environment Simulation', () => {
  test('Temperature should change smoothly without sudden jumps', () => {
    const weatherData = {
      temperature: 25,
      humidity: 60,
      cloudCover: 0.2,
      precipitation: 0,
      windSpeed: 2
    };
    
    const controlEffects = {
      heating: 80, // 高功率加热
      cooling: 0,
      ventilation: 0,
      humidification: 0,
      dehumidification: 0,
      lighting: 0,
      irrigation: 0,
      co2Injection: 0
    };
    
    // 先进行一次计算，获取初始状态
    const firstResult = calculateIndoorEnvironment(weatherData, controlEffects);
    
    // 急剧改变外部温度
    weatherData.temperature = 10; // 室外温度骤降
    
    // 继续计算几个周期
    let results = [firstResult];
    for (let i = 0; i < 10; i++) {
      const newResult = calculateIndoorEnvironment(weatherData, controlEffects);
      results.push(newResult);
    }
    
    // 检查温度变化率
    for (let i = 1; i < results.length; i++) {
      const tempChange = Math.abs(results[i].airTemperature - results[i-1].airTemperature);
      // 温度变化不应超过每周期0.3℃
      expect(tempChange).toBeLessThanOrEqual(0.3);
    }
  });
  
  test('limitChangeRate should correctly limit parameter change', () => {
    // 测试变化率限制函数
    const previous = 25;
    const current = 30;  // 5度变化
    const maxRate = 0.3; // 每分钟最大0.3度
    const deltaTime = 3000; // 3秒
    
    // 预期最大变化: 0.3 * (3000/60000) = 0.015度
    const limited = limitChangeRate(current, previous, maxRate, deltaTime);
    
    // 结果应该是: 25 + 0.015 = 25.015
    expect(limited).toBeCloseTo(25.015, 3);
  });
});
```

### 4.3 UI测试

对于核心UI功能，添加组件测试：

```typescript
// src/components/__tests__/ControlCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ControlCard } from '../ControlCard';

describe('ControlCard', () => {
  test('should toggle between auto and manual mode', () => {
    const onModeChange = jest.fn();
    const { getByRole } = render(
      <ControlCard 
        title="测试系统"
        isAuto={true}
        power={50}
        onModeChange={onModeChange}
        onPowerChange={jest.fn()}
      />
    );
  
    // 模拟点击切换开关
    const toggle = getByRole('switch');
    fireEvent.click(toggle);
  
    // 验证回调是否被调用
    expect(onModeChange).toHaveBeenCalledWith(false);
  });
  
  // 添加更多测试...
});
```

### 4.4 调试技巧

开发时可以使用以下技巧进行调试：

1. 使用 React DevTools 检查组件状态
2. 使用 console.log 或浏览器开发工具进行调试
3. 临时增加更新频率以便快速观察系统反应

```typescript
// 临时调试代码示例
useEffect(() => {
  // 增加日志记录
  console.log('Sensor data updated:', sensorData);
  
  // 临时增加计算频率
  const debugInterval = 1000; // 生产环境中应该是5000
  
  const timer = setInterval(() => {
    console.log('Recalculating system power...');
    setSystems(prev => {
      // ... 系统更新逻辑
    });
  }, debugInterval);

  return () => clearInterval(timer);
}, [sensorData]);
```

## 5. 性能优化指南

系统处理大量实时数据，性能优化至关重要：

### 5.1 React组件优化

```typescript
// 使用React.memo避免不必要的重渲染
const SensorCard = React.memo(({ title, value, unit }: SensorCardProps) => {
  return (
    <Card title={title}>
      <Value>{value}</Value>
      <Unit>{unit}</Unit>
    </Card>
  );
});

// 使用useMemo缓存计算结果
const chartOptions = useMemo(() => {
  return {
    // 复杂的图表配置
  };
}, [data]); // 只在data变化时重新计算

// 使用useCallback缓存函数
const handlePowerChange = useCallback((value: number) => {
  setPower(value);
}, []);
```

### 5.2 数据处理优化

```typescript
// 数据批处理
function processBatchData(data: SensorData[]): ProcessedData {
  // 一次处理多条数据而不是循环处理
  const temperatures = data.map(item => item.airTemperature);
  
  return {
    average: temperatures.reduce((sum, val) => sum + val, 0) / temperatures.length,
    max: Math.max(...temperatures),
    min: Math.min(...temperatures)
  };
}

// 使用Web Worker处理耗时计算
// worker.js
self.onmessage = function(e) {
  const data = e.data;
  const result = performHeavyCalculation(data);
  self.postMessage(result);
};

// 在组件中使用
useEffect(() => {
  if (data) {
    const worker = new Worker('worker.js');
    worker.onmessage = function(e) {
      setProcessedData(e.data);
    };
    worker.postMessage(data);
  
    return () => worker.terminate();
  }
}, [data]);
```

### 5.3 渲染优化

```typescript
// 使用虚拟滚动处理长列表
import { FixedSizeList } from 'react-window';

function LogList({ logs }) {
  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={logs.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <div style={style}>
          {logs[index].message}
        </div>
      )}
    </FixedSizeList>
  );
}

// 使用Canvas优化大数据图表
function OptimizedChart({ data }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && data) {
      const ctx = canvasRef.current.getContext('2d');
      // 绘制图表逻辑
    }
  }, [data]);
  
  return <canvas ref={canvasRef} width={800} height={400} />;
}
```

## 6. 最佳实践与规范

### 6.1 编码规范

项目使用 ESLint 和 Prettier 确保代码质量和风格一致性：

- 使用 TypeScript 类型系统确保类型安全
- 遵循功能组件和 React Hooks 的最佳实践
- 使用有意义的命名约定
- 添加必要的注释和文档

### 6.2 性能考虑

- 避免不必要的重渲染
- 优化大数据处理
- 使用适当的缓存策略
- 监控内存使用情况

### 6.3 用户体验最佳实践

- 确保UI响应迅速，无明显延迟
- 提供明确的错误处理和用户反馈
- 确保交互元素（如滑块）的操作流畅直观
- 优先考虑可访问性和易用性

---

*版权所有 © 2024 IntelliAgriculture. 保留所有权利。*
