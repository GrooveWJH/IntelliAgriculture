# 实时监控系统设计与实现

## 1. 实时监控系统架构

智能温室环境控制系统的实时监控功能通过以下组件实现：

1. **传感器数据模拟**：由 `SensorDataContext` 实现数据的生成和更新
2. **数据可视化**：通过图表和仪表盘展示实时和历史数据
3. **报警机制**：根据阈值设定实现自动报警
4. **数据分析**：提供趋势分析和预测功能

## 2. 传感器数据模拟

### 2.1 数据上下文实现

**文件位置**：`src/contexts/SensorDataContext.tsx`

系统通过 Context API 实现传感器数据的生成和共享：

```typescript
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
```

### 2.2 传感器数据类型

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
  ec: number;
}
```

### 2.3 数据生成算法

系统会根据配置的范围生成模拟传感器数据，以测试和演示系统功能：

```typescript
const generateSensorData = (): SensorData => {
  return {
    timestamp: Date.now(),
    airTemperature: Number((20 + Math.random() * 10).toFixed(2)),  // 20-30℃
    airHumidity: Number((60 + Math.random() * 20).toFixed(2)),     // 60-80%
    soilMoisture: Number((70 + Math.random() * 15).toFixed(2)),    // 70-85%
    soilTemperature: Number((18 + Math.random() * 8).toFixed(2)),  // 18-26℃
    co2Level: Number((400 + Math.random() * 200).toFixed(2)),      // 400-600ppm
    lightIntensity: Number((2000 + Math.random() * 1000).toFixed(2)), // 2000-3000lux
    soilPH: Number((6.5 + Math.random()).toFixed(2)),              // 6.5-7.5
    ec: Number((1.2 + Math.random() * 0.5).toFixed(2)),            // 1.2-1.7 mS/cm
  };
};
```

## 3. 实时监控界面

### 3.1 仪表盘布局

**文件位置**：`src/pages/Dashboard.tsx`

仪表盘页面通过卡片布局展示各环境参数的实时状态：

```tsx
<Row gutter={[16, 16]}>
  {Object.entries(parameterConfig).map(([key, config]) => (
    <Col xs={24} sm={12} md={8} lg={6} key={key}>
      <ParameterCard
        title={config.title}
        value={sensorData ? sensorData[key as keyof SensorData] : 0}
        unit={config.unit}
        status={getParameterStatus(key as keyof SensorData, sensorData)}
        min={config.min}
        max={config.max}
        target={config.target}
        icon={config.icon}
      />
    </Col>
  ))}
</Row>
```

### 3.2 参数卡片组件

**文件位置**：`src/components/ParameterCard.tsx`

每个环境参数通过独立的卡片组件展示，包含当前值、状态和趋势：

```tsx
const ParameterCard: React.FC<ParameterCardProps> = ({
  title,
  value,
  unit,
  status,
  min,
  max,
  target,
  icon
}) => {
  return (
    <Card className="parameter-card">
      <div className="parameter-header">
        <div className="parameter-icon">{icon}</div>
        <div className="parameter-title">{title}</div>
      </div>
      
      <div className="parameter-value">
        <span className="value">{value.toFixed(1)}</span>
        <span className="unit">{unit}</span>
      </div>
      
      <Progress 
        percent={((value - min) / (max - min)) * 100} 
        strokeColor={getStatusColor(status)}
        showInfo={false}
      />
      
      <div className="parameter-footer">
        <StatusTag status={status} />
        <div className="parameter-target">
          目标: {target} {unit}
        </div>
      </div>
    </Card>
  );
};
```

### 3.3 参数状态计算

系统根据当前值与设定的目标值和警戒值比较，计算出参数的状态：

```typescript
const getParameterStatus = (parameter: keyof SensorData, data: SensorData | null): ParameterStatus => {
  if (!data) return 'normal';
  
  const config = parameterConfig[parameter];
  const value = data[parameter];
  
  if (value >= config.criticalThreshold || value <= config.min) {
    return 'critical';
  } else if (value >= config.warningThreshold || value <= config.min + (config.target - config.min) * 0.3) {
    return 'warning';
  } else {
    return 'normal';
  }
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

## 6. 数据分析功能

### 6.1 趋势分析

系统对历史数据进行分析，计算关键指标的变化趋势：

```typescript
export const analyzeTrend = (data: SensorData[], parameter: keyof SensorData): TrendAnalysis => {
  if (data.length < 2) {
    return { trend: 'stable', changeRate: 0 };
  }
  
  // 计算平均变化率
  let totalChange = 0;
  for (let i = 1; i < data.length; i++) {
    const timeDiff = (data[i].timestamp - data[i-1].timestamp) / 1000; // 秒
    const valueDiff = data[i][parameter] - data[i-1][parameter];
    totalChange += (valueDiff / timeDiff);
  }
  
  const averageChangeRate = totalChange / (data.length - 1);
  
  // 判断趋势
  let trend: 'rising' | 'falling' | 'stable';
  if (averageChangeRate > 0.01) {
    trend = 'rising';
  } else if (averageChangeRate < -0.01) {
    trend = 'falling';
  } else {
    trend = 'stable';
  }
  
  return { trend, changeRate: averageChangeRate };
};
```

### 6.2 相关性分析

系统分析不同环境参数之间的相关性，帮助理解参数间的影响关系：

```typescript
export const calculateCorrelation = (data: SensorData[], param1: keyof SensorData, param2: keyof SensorData): number => {
  if (data.length < 3) return 0;
  
  const values1 = data.map(d => d[param1]);
  const values2 = data.map(d => d[param2]);
  
  const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
  const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;
  
  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;
  
  for (let i = 0; i < values1.length; i++) {
    const diff1 = values1[i] - mean1;
    const diff2 = values2[i] - mean2;
    
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }
  
  return numerator / Math.sqrt(denom1 * denom2);
};
```

## 7. 系统参数配置

环境参数的配置信息定义了各参数的标题、单位、范围和警戒值：

```typescript
export const parameterConfig = {
  airTemperature: {
    title: '空气温度',
    unit: '°C',
    min: 20,
    max: 30,
    target: 25,
    warningThreshold: 30,
    criticalThreshold: 35,
    icon: <ThermometerOutlined />
  },
  airHumidity: {
    title: '空气湿度',
    unit: '%',
    min: 60,
    max: 80,
    target: 70,
    warningThreshold: 80,
    criticalThreshold: 85,
    icon: <CloudOutlined />
  },
  soilMoisture: {
    title: '土壤湿度',
    unit: '%',
    min: 70,
    max: 85,
    target: 75,
    warningThreshold: 85,
    criticalThreshold: 90,
    icon: <ExperimentOutlined />
  },
  // 其他参数配置...
};
``` 