# 实时监控系统实现

## 1. 系统概述

自然生态智慧农业大棚控制系统的实时监控功能通过以下组件实现：

1. **传感器数据模拟**: 生成模拟的环境参数数据
2. **数据可视化**: 实时展示环境数据的变化趋势
3. **报警机制**: 监测环境参数异常并及时报警
4. **数据分析**: 对环境数据进行简单分析和趋势预测

## 2. 传感器数据上下文

**文件位置**: `src/contexts/SensorDataContext.tsx`

系统使用Context API创建全局的传感器数据上下文，为应用提供一致的数据访问：

```tsx
// SensorDataContext.tsx 的核心代码如下：
import React, { createContext, useState, useEffect, useContext } from 'react';
import { SensorData, generateSensorData } from '../utils/sensorDataGenerator';
import { TimeSeriesStorage } from '../services/TimeSeriesStorage';
import { checkAlarms, WarningLog } from '../services/AlarmService';

interface SensorDataContextType {
  currentData: SensorData | null;
  isLoading: boolean;
  warnings: WarningLog[];
  getHistoricalData: (start: number, end: number) => Promise<SensorData[]>;
  clearWarning: (timestamp: number) => void;
}

const SensorDataContext = createContext<SensorDataContextType | undefined>(undefined);

export const SensorDataProvider: React.FC = ({ children }) => {
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [warnings, setWarnings] = useState<WarningLog[]>([]);
  
  // 存储服务实例
  const storage = TimeSeriesStorage.getInstance();
  
  // 定时生成传感器数据
  useEffect(() => {
    setIsLoading(true);
    
    // 初始化数据
    const initialData = generateSensorData();
    setCurrentData(initialData);
    storage.storeData(initialData);
    setIsLoading(false);
    
    // 设置定时器，每秒生成新数据
    const intervalId = setInterval(() => {
      const newData = generateSensorData();
      setCurrentData(newData);
      storage.storeData(newData);
      
      // 检查报警
      const newWarnings = checkAlarms(newData);
      if (newWarnings.length > 0) {
        setWarnings(prev => [...prev, ...newWarnings]);
        // 保存报警日志
        newWarnings.forEach(warning => {
          storage.storeWarning(warning);
        });
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // 获取历史数据
  const getHistoricalData = async (start: number, end: number): Promise<SensorData[]> => {
    return await storage.getData(start, end);
  };
  
  // 清除报警
  const clearWarning = (timestamp: number) => {
    setWarnings(prev => prev.filter(w => w.timestamp !== timestamp));
  };
  
  return (
    <SensorDataContext.Provider value={{ 
      currentData, 
      isLoading, 
      warnings, 
      getHistoricalData, 
      clearWarning 
    }}>
      {children}
    </SensorDataContext.Provider>
  );
};

export const useSensorData = () => {
  const context = useContext(SensorDataContext);
  if (context === undefined) {
    throw new Error('useSensorData must be used within a SensorDataProvider');
  }
  return context;
};
```

## 3. 传感器数据生成

### 3.1 传感器数据类型

**文件位置**: `src/types/sensorData.ts`

```typescript
export interface SensorData {
  timestamp: number;
  airTemperature: number;
  airHumidity: number;
  soilMoisture: number;
  soilTemperature: number;
  co2Level: number;
  lightIntensity: number;
  soilPH: number;
  ec: number; // 电导率，表示溶液中的离子含量
}
```

### 3.2 数据生成算法

**文件位置**: `src/utils/sensorDataGenerator.ts`

```typescript
import { SensorData } from '../types/sensorData';
import { environmentConfig } from '../config/environmentConfig';

// 生成随机波动的传感器数据
export const generateSensorData = (): SensorData => {
  const now = Date.now();
  const hour = new Date().getHours();
  
  // 基于时间的变化模式：白天温度高、湿度低，夜间温度低、湿度高
  const isDaytime = hour >= 6 && hour <= 18;
  const dayFactor = isDaytime ? 1 : 0.8;
  
  // 添加随机波动
  const randomFactor = (min: number, max: number) => 
    min + Math.random() * (max - min);
  
  // 生成带有自然波动的传感器数据
  return {
    timestamp: now,
    airTemperature: environmentConfig.airTemperature.target * dayFactor * randomFactor(0.9, 1.1),
    airHumidity: environmentConfig.airHumidity.target * (2 - dayFactor) * randomFactor(0.9, 1.1),
    soilMoisture: environmentConfig.soilMoisture.target * randomFactor(0.95, 1.05),
    soilTemperature: environmentConfig.soilTemperature.target * dayFactor * randomFactor(0.95, 1.05),
    co2Level: environmentConfig.co2Level.target * randomFactor(0.9, 1.1),
    lightIntensity: environmentConfig.lightIntensity.target * dayFactor * randomFactor(0.7, 1.3),
    soilPH: environmentConfig.soilPH.target * randomFactor(0.98, 1.02),
    ec: environmentConfig.ec.target * randomFactor(0.95, 1.05)
  };
};
```

## 4. 实时图表展示

### 4.1 时间序列图表

**文件位置**：`src/components/TimeSeriesChart.tsx`

系统使用 Echarts 实现时间序列数据的可视化：

```tsx
const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  title,
  yAxisLabel,
  color = '#1890ff',
  height = 300
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    
    const option: echarts.EChartsOption = {
      title: {
        text: title,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params: any) {
          const dataPoint = params[0];
          return `${formatDateTime(dataPoint.value[0])}<br/>${dataPoint.marker} ${dataPoint.value[1].toFixed(2)} ${yAxisLabel}`;
        }
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: '{HH}:{mm}:{ss}'
        }
      },
      yAxis: {
        type: 'value',
        name: yAxisLabel
      },
      series: [
        {
          type: 'line',
          data: data.map(item => [item.timestamp, item.value]),
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: color,
            width: 2
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color },
              { offset: 1, color: 'rgba(255, 255, 255, 0.3)' }
            ])
          }
        }
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      }
    };
    
    chartInstance.current.setOption(option);
    
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [data, title, yAxisLabel, color]);

  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div ref={chartRef} style={{ height, width: '100%' }} />;
};
```

### 4.2 历史数据查询

系统支持按时间段查询历史数据，并通过图表展示变化趋势：

```tsx
const [timeRange, setTimeRange] = useState<[number, number]>([
  Date.now() - 3600000, // 过去1小时
  Date.now()
]);

const [historicalData, setHistoricalData] = useState<SensorData[]>([]);

useEffect(() => {
  const data = getHistoricalData(timeRange[0], timeRange[1]);
  setHistoricalData(data);
}, [timeRange, getHistoricalData]);
```

## 5. 报警系统实现

### 5.1 报警逻辑

**文件位置**：`src/services/AlarmService.ts`

系统根据传感器数据和警戒阈值设置，自动检测异常状态并生成报警：

```typescript
export const checkAlarms = (data: SensorData): WarningLog[] => {
  const warnings: WarningLog[] = [];
  const now = Date.now();
  
  // 检查空气温度
  if (data.airTemperature > environmentConfig.airTemperature.criticalThreshold) {
    warnings.push({
      timestamp: now,
      parameter: 'airTemperature',
      value: data.airTemperature,
      message: `空气温度过高: ${data.airTemperature}℃，超过临界值: ${environmentConfig.airTemperature.criticalThreshold}℃`,
      level: 'critical'
    });
  } else if (data.airTemperature > environmentConfig.airTemperature.warningThreshold) {
    warnings.push({
      timestamp: now,
      parameter: 'airTemperature',
      value: data.airTemperature,
      message: `空气温度偏高: ${data.airTemperature}℃，超过警戒值: ${environmentConfig.airTemperature.warningThreshold}℃`,
      level: 'warning'
    });
  }
  
  // 检查其他参数...
  
  return warnings;
};
```

### 5.2 报警记录存储

报警信息会存储到数据库中，便于后续查询和统计：

```typescript
export const saveWarningLog = async (log: WarningLog): Promise<void> => {
  const db = await initDB();
  await db.put('warningLogs', log);
};
```

### 5.3 报警通知显示

系统通过通知组件展示报警信息，并提供处理选项：

```tsx
const AlarmNotification: React.FC<AlarmNotificationProps> = ({ alarm, onClose }) => {
  const handleAction = () => {
    // 根据报警类型执行相应操作
    switch (alarm.parameter) {
      case 'airTemperature':
        // 打开通风系统
        break;
      case 'airHumidity':
        // 打开加湿或通风系统
        break;
      // 其他参数处理...
    }
    onClose();
  };

  return (
    <Alert
      message={`${getParameterTitle(alarm.parameter)} 报警`}
      description={alarm.message}
      type={alarm.level === 'critical' ? 'error' : 'warning'}
      showIcon
      action={
        <Button size="small" type="ghost" onClick={handleAction}>
          自动处理
        </Button>
      }
      closable
      onClose={onClose}
    />
  );
};
```

## 6. 仪表盘布局

### 6.1 布局结构

**文件位置**：`src/components/Dashboard.tsx`

仪表盘采用响应式网格布局，适配不同屏幕尺寸：

```tsx
const Dashboard: React.FC = () => {
  const { currentData, isLoading, warnings } = useSensorData();

  return (
    <div className="dashboard">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <ParameterCard
            title="空气温度"
            value={currentData?.airTemperature}
            unit="°C"
            icon={<ThermometerOutlined />}
            color="#ff7a45"
            isLoading={isLoading}
            thresholds={environmentConfig.airTemperature}
          />
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={6}>
          <ParameterCard
            title="空气湿度"
            value={currentData?.airHumidity}
            unit="%"
            icon={<CloudOutlined />}
            color="#1890ff"
            isLoading={isLoading}
            thresholds={environmentConfig.airHumidity}
          />
        </Col>
        
        {/* 其他参数卡片 */}
      </Row>
      
      {/* 警告显示区域 */}
      <div className="warnings-container">
        {warnings.map(warning => (
          <AlarmNotification 
            key={warning.timestamp} 
            alarm={warning} 
            onClose={() => clearWarning(warning.timestamp)}
          />
        ))}
      </div>
    </div>
  );
};
```

### 6.2 参数卡片组件

**文件位置**：`src/components/ParameterCard.tsx`

参数卡片展示单个环境参数的当前值和状态：

```tsx
const ParameterCard: React.FC<ParameterCardProps> = ({
  title,
  value,
  unit,
  icon,
  color,
  isLoading,
  thresholds
}) => {
  // 计算参数状态
  const getStatus = () => {
    if (value === undefined || value === null) return 'normal';
    if (value > thresholds.criticalThreshold) return 'critical';
    if (value > thresholds.warningThreshold) return 'warning';
    return 'normal';
  };
  
  const status = getStatus();
  
  // 状态颜色映射
  const statusColors = {
    normal: '#52c41a',
    warning: '#faad14',
    critical: '#f5222d'
  };
  
  return (
    <Card className="parameter-card" bordered={false}>
      <Skeleton loading={isLoading} active paragraph={{ rows: 1 }}>
        <div className="card-title">
          {icon} {title}
        </div>
        <div className="card-value" style={{ color: statusColors[status] }}>
          {value !== undefined && value !== null ? value.toFixed(1) : '--'} 
          <span className="unit">{unit}</span>
        </div>
        <Progress 
          percent={value !== undefined && value !== null 
            ? (value / thresholds.criticalThreshold) * 100 
            : 0
          } 
          strokeColor={statusColors[status]}
          status={status === 'critical' ? 'exception' : 'normal'}
          showInfo={false}
        />
        <div className="status-text" style={{ color: statusColors[status] }}>
          {status === 'normal' ? '正常' : status === 'warning' ? '警告' : '危险'}
        </div>
      </Skeleton>
    </Card>
  );
};
```

## 7. 数据分析功能

### 7.1 趋势分析

系统提供环境参数的趋势分析功能，帮助用户理解农业大棚环境的变化模式：

```tsx
const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ paramName, data }) => {
  // 计算变化趋势
  const calculateTrend = () => {
    if (data.length < 2) return { direction: 'stable', percentage: 0 };
    
    const latestValue = data[data.length - 1].value;
    const earliestValue = data[0].value;
    const change = latestValue - earliestValue;
    const percentage = (change / earliestValue) * 100;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.abs(percentage)
    };
  };
  
  const trend = calculateTrend();
  
  return (
    <div className="trend-analysis">
      <h3>{getParameterTitle(paramName)} 变化趋势</h3>
      <div className="trend-indicator">
        {trend.direction === 'up' && <ArrowUpOutlined style={{ color: '#f5222d' }} />}
        {trend.direction === 'down' && <ArrowDownOutlined style={{ color: '#52c41a' }} />}
        {trend.direction === 'stable' && <MinusOutlined style={{ color: '#1890ff' }} />}
        <span className="percentage">{trend.percentage.toFixed(1)}%</span>
        <span className="direction-text">
          {trend.direction === 'up' ? '上升' : trend.direction === 'down' ? '下降' : '稳定'}
        </span>
      </div>
      <p className="analysis-text">
        {generateAnalysisText(paramName, trend)}
      </p>
    </div>
  );
};

// 生成分析文本
const generateAnalysisText = (paramName: string, trend: { direction: string, percentage: number }) => {
  // 根据参数名和趋势生成适当的分析文本
  if (paramName === 'airTemperature') {
    if (trend.direction === 'up' && trend.percentage > 5) {
      return '温度明显上升，请注意通风降温。';
    } else if (trend.direction === 'down' && trend.percentage > 5) {
      return '温度明显下降，请注意保温。';
    } else {
      return '温度保持稳定，农业大棚环境良好。';
    }
  }
  
  // 其他参数的分析文本...
  
  return '参数变化在正常范围内。';
};
```

### 7.2 参数相关性分析

系统提供环境参数间的相关性分析，帮助用户理解不同环境因素间的关联：

```tsx
const CorrelationAnalysis: React.FC<CorrelationAnalysisProps> = ({ data }) => {
  // 计算参数对之间的相关系数
  const calculateCorrelation = () => {
    const parameters = ['airTemperature', 'airHumidity', 'soilMoisture', 'lightIntensity', 'co2Level'];
    const correlationMatrix: Record<string, Record<string, number>> = {};
    
    parameters.forEach(param1 => {
      correlationMatrix[param1] = {};
      parameters.forEach(param2 => {
        if (param1 === param2) {
          correlationMatrix[param1][param2] = 1; // 自相关为1
        } else {
          // 提取两个参数的数据序列
          const series1 = data.map(d => d[param1 as keyof SensorData] as number);
          const series2 = data.map(d => d[param2 as keyof SensorData] as number);
          
          // 计算皮尔逊相关系数
          correlationMatrix[param1][param2] = calculatePearsonCorrelation(series1, series2);
        }
      });
    });
    
    return correlationMatrix;
  };
  
  const correlationMatrix = calculateCorrelation();
  
  // 使用热力图展示相关性矩阵
  // 实现省略...
  
  return (
    <div className="correlation-analysis">
      <h3>环境参数相关性分析</h3>
      <div className="heatmap-container">
        {/* 热力图渲染 */}
      </div>
      <div className="correlation-insights">
        <h4>主要发现</h4>
        <ul>
          {Object.entries(correlationMatrix).map(([param1, relations]) => {
            // 找出与该参数相关性最强的另一个参数
            const strongestCorrelation = Object.entries(relations)
              .filter(([param2]) => param1 !== param2)
              .sort(([, value1], [, value2]) => Math.abs(value2) - Math.abs(value1))[0];
            
            if (strongestCorrelation) {
              const [param2, coefficient] = strongestCorrelation;
              return (
                <li key={`${param1}-${param2}`}>
                  {getParameterTitle(param1)} 与 {getParameterTitle(param2)} 
                  {coefficient > 0 ? ' 正相关' : ' 负相关'}，
                  相关系数为 {Math.abs(coefficient).toFixed(2)}
                </li>
              );
            }
            return null;
          })}
        </ul>
      </div>
    </div>
  );
};
```

## 8. 数据导出功能

系统支持将环境参数数据导出为CSV格式，方便进一步分析：

```tsx
const exportToCSV = (data: SensorData[], timeRange: [number, number]) => {
  const startDate = new Date(timeRange[0]).toLocaleString();
  const endDate = new Date(timeRange[1]).toLocaleString();
  
  // 构建CSV表头
  const headers = [
    '时间戳', '时间', '空气温度(℃)', '空气湿度(%)', 
    '土壤湿度(%)', '土壤温度(℃)', 'CO2浓度(ppm)', 
    '光照强度(lux)', '土壤pH值', '电导率(mS/cm)'
  ];
  
  // 构建CSV行数据
  const rows = data.map(d => [
    d.timestamp,
    new Date(d.timestamp).toLocaleString(),
    d.airTemperature.toFixed(1),
    d.airHumidity.toFixed(1),
    d.soilMoisture.toFixed(1),
    d.soilTemperature.toFixed(1),
    d.co2Level.toFixed(0),
    d.lightIntensity.toFixed(0),
    d.soilPH.toFixed(2),
    d.ec.toFixed(2)
  ]);
  
  // 组合CSV内容
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `农业大棚数据_${startDate}_${endDate}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  
  // 触发下载
  link.click();
  
  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
``` 