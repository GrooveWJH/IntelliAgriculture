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

### 3.3 添加新的警报处理

增强系统的警报处理功能：

```typescript
// src/services/AlertService.ts
export function checkAlerts(
  sensorData: SensorData,
  thresholds: WarningThresholds
): Alert[] {
  const alerts: Alert[] = [];
  
  // 检查各个参数是否超过阈值
  if (sensorData.airTemperature > thresholds.temperature) {
    alerts.push({
      type: 'temperature',
      level: 'warning',
      message: `温度过高: ${sensorData.airTemperature}℃`,
      timestamp: sensorData.timestamp
    });
  }
  
  // 添加新的警报逻辑
  if (sensorData.newSensorType > thresholds.newSensorType) {
    alerts.push({
      type: 'newSensorType',
      level: 'warning',
      message: `新传感器值过高: ${sensorData.newSensorType}`,
      timestamp: sensorData.timestamp
    });
  }
  
  return alerts;
}

// 在contexts中使用
useEffect(() => {
  if (sensorData) {
    const newAlerts = checkAlerts(sensorData, warningThresholds);
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 100));
      // 处理通知逻辑
      newAlerts.forEach(alert => {
        notification.warning({
          message: '系统警报',
          description: alert.message
        });
      });
    }
  }
}, [sensorData, warningThresholds]);
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

### 4.2 UI测试

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

### 4.3 调试技巧

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
      if (ctx) {
        // 直接使用Canvas API绘制图表
        // 这比使用高级图表库渲染大量数据点更高效
      }
    }
  }, [data]);
  
  return <canvas ref={canvasRef} width={800} height={400} />;
}
```

## 6. 代码风格与最佳实践

### 6.1 TypeScript类型定义

```typescript
// 定义清晰的接口而不是使用any
interface SensorData {
  timestamp: number;
  airTemperature: number;
  airHumidity: number;
  // 其他传感器数据
}

// 使用联合类型表示有限的可能值
type AlertLevel = 'info' | 'warning' | 'critical';

// 使用泛型增强可复用性
function getLatestData<T extends { timestamp: number }>(data: T[]): T | null {
  if (data.length === 0) return null;
  return data.reduce((latest, item) => 
    item.timestamp > latest.timestamp ? item : latest
  );
}
```

### 6.2 代码注释规范

```typescript
/**
 * 计算系统需要的功率百分比
 * 
 * @param system - 控制系统配置
 * @param sensorData - 当前传感器数据
 * @returns 计算出的功率百分比(0-100)
 * 
 * @example
 * const power = calculateSystemPower(ventilationSystem, currentData);
 * // power = 45 表示风扇应该运行在45%功率
 */
function calculateSystemPower(
  system: ControlSystem,
  sensorData: SensorData
): number {
  // 实现逻辑...
}
```

### 6.3 文件组织

```
// 相关功能应该放在一起
src/features/environmental-control/
├── components/                 // 特定于此功能的组件
│   ├── ControlPanel.tsx 
│   └── SystemCard.tsx
├── hooks/                      // 特定于此功能的自定义hooks
│   └── useSystemControl.ts
├── services/                   // 业务逻辑
│   └── controlAlgorithms.ts
└── index.tsx                   // 导出公共API
```

### 6.4 错误处理

```typescript
// 全局错误边界
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // 记录错误到监控服务
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} />;
    }
    return this.props.children;
  }
}

// 使用try-catch处理异步操作
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('Failed to fetch data:', err);
    // 显示用户友好的错误消息
    notification.error({
      message: '数据加载失败',
      description: '无法加载传感器数据，请稍后再试'
    });
    // 返回默认数据或重新抛出错误
    return defaultData;
  }
}
```

## 7. 部署与维护

### 7.1 构建优化

```
// package.json
{
  "scripts": {
    "build": "react-scripts build",
    "build:analyze": "source-map-explorer 'build/static/js/*.js'",
    "postbuild": "gzip -9 -r build/static"
  }
}
```

### 7.2 环境配置

```typescript
// src/config/environment.ts
const env = process.env.NODE_ENV || 'development';

// 根据环境配置不同参数
export const CONFIG = {
  development: {
    updateInterval: 1000,
    useMockData: true,
    apiBaseUrl: 'http://localhost:3001/api'
  },
  production: {
    updateInterval: 5000,
    useMockData: false,
    apiBaseUrl: 'https://api.example.com'
  }
}[env];
```

### 7.3 版本控制与发布

```
// 版本命名约定
// 主版本.次版本.补丁版本
// 例如: 1.2.3

// package.json
{
  "version": "1.2.3",
  "scripts": {
    "version:patch": "npm version patch && git push && git push --tags",
    "version:minor": "npm version minor && git push && git push --tags",
    "version:major": "npm version major && git push && git push --tags"
  }
}
```

## 8. 常见问题解决

### 8.1 性能问题

**问题**：大量数据导致UI卡顿

**解决方案**：

1. 实现数据分页或虚拟滚动
2. 减少重渲染（使用React.memo, useMemo等）
3. 使用Web Worker处理大量计算
4. 优化渲染策略（按需渲染、懒加载）

### 8.2 状态管理问题

**问题**：组件间状态同步困难

**解决方案**：

1. 使用React Context API管理全局状态
2. 考虑使用Redux或MobX等状态管理库
3. 使用组合组件而不是深层嵌套
4. 实现自定义Hooks简化状态逻辑

### 8.3 数据一致性问题

**问题**：实时数据与历史数据不一致

**解决方案**：

1. 实现单一数据源原则
2. 使用乐观更新策略
3. 实现数据版本控制
4. 添加数据验证和错误处理

## 9. 扩展阅读资源

- [React官方文档](https://reactjs.org/docs/getting-started.html)
- [TypeScript手册](https://www.typescriptlang.org/docs/)
- [Ant Design组件库](https://ant.design/components/overview/)
- [ECharts文档](https://echarts.apache.org/en/index.html)
- [React性能优化](https://reactjs.org/docs/optimizing-performance.html)
