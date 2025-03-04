# 智能温室环境控制系统技术文档

## 1. 数据生成与存储机制

### 1.1 传感器数据生成

**位置**：`src/contexts/SensorDataContext.tsx`

**更新频率**：1000ms（1秒）

**数据生成范围**：

```typescript
{
  timestamp: Date.now(),
  airTemperature: 20-30℃     // 室温范围
  airHumidity: 60-80%        // 空气湿度范围
  soilMoisture: 70-85%       // 土壤湿度范围
  soilTemperature: 18-26℃    // 土壤温度范围
  co2Level: 400-600ppm       // CO2浓度范围
  lightIntensity: 2000-3000lux // 光照强度范围
  soilPH: 6.5-7.5           // 土壤pH值范围
  ec: 1.2-1.7 mS/cm         // 电导率范围
}
```

### 1.2 时序数据存储

**位置**：`src/services/TimeSeriesStorage.ts`

**存储策略**：

```typescript
const SAMPLING_INTERVALS = {
  LAST_MINUTE: 1,          // 1秒
  LAST_HOUR: 60,          // 1分钟
  LAST_DAY: 1800,         // 30分钟
  LAST_MONTH: 3600,       // 1小时
}
```

**数据降采样实现**：

```typescript
private downsample(): void {
  // 1. 根据时间范围更新采样间隔
  this.data = this.data.map(item => {
    const newInterval = this.determineSamplingInterval(item.timestamp);
    return newInterval > item.interval ? { ...item, interval: newInterval } : item;
  });

  // 2. 按时间槽和间隔分组
  const groupedData: { [key: string]: TimeSeriesData[] } = {};
  this.data.forEach(item => {
    const timeSlot = Math.floor(item.timestamp / (item.interval * 1000));
    const key = `${timeSlot}_${item.interval}`;
    if (!groupedData[key]) groupedData[key] = [];
    groupedData[key].push(item);
  });

  // 3. 计算每组平均值
  this.data = Object.values(groupedData).map(group => {
    if (group.length === 1) return group[0];
  
    const avgData = group.reduce((acc: Partial<SensorData>, curr) => {
      const { timestamp, ...numericData } = curr.data;
      Object.entries(numericData).forEach(([key, value]) => {
        if (typeof value === 'number') {
          acc[key as keyof SensorData] = ((acc[key as keyof SensorData] as number) || 0) + value / group.length;
        }
      });
      return acc;
    }, {});

    return {
      timestamp: Math.floor(group[0].timestamp / (group[0].interval * 1000)) * (group[0].interval * 1000),
      data: { timestamp: group[0].timestamp, ...avgData } as SensorData,
      interval: group[0].interval
    };
  });
}
```

**数据库大小控制**：

```typescript
private maintainDbSize(): void {
  while (this.dbSize > MAX_DB_SIZE && this.data.length > 0) {
    const removedData = this.data.shift();
    if (removedData) {
      this.dbSize -= this.calculateDataSize(removedData);
    }
  }
}
```

### 1.3 系统状态更新

**位置**：`src/pages/EnvironmentControl.tsx`

**更新频率**：5000ms（5秒）

**更新内容**：各子系统运行功率

## 2. 数学模型与计算公式

### 2.1 系统启动阈值计算

#### 2.1.1 通风系统

```typescript
功率百分比 = min(100, max(
  (当前温度 - 警戒温度) / 5 * 100,
  (当前湿度 - 警戒湿度) / 10 * 100
))
```

**原理**：

- 温度每超过警戒值5℃，功率增加100%
- 湿度每超过警戒值10%，功率增加100%
- 取两者最大值，确保对温度和湿度的及时响应

#### 2.1.2 加湿系统

```typescript
功率百分比 = min(100, (目标湿度60% - 当前湿度) * 5)
```

**原理**：每低于目标1%，功率增加5%，确保平缓加湿

#### 2.1.3 补光系统

```typescript
功率百分比 = min(100, ((2000lux - 当前光照) / 2000) * 100)
```

**原理**：按照目标光照的比例计算功率，确保光照补充的平滑过渡

### 2.2 系统功率动态调节

#### 2.2.1 通风系统动态功率

```typescript
if (tempDiff > 2 || humidityDiff > 10 || Math.abs(co2Diff) > 200) {
  功率 = min(100, max(30, 
    max(
      tempDiff > 0 ? tempDiff * 20 : 0,
      humidityDiff > 0 ? humidityDiff * 5 : 0,
      Math.abs(co2Diff) > 200 ? 30 : 0
    )
  ))
}
```

## 3. 界面布局与组件设计

### 3.1 侧边栏布局

**位置**：`src/components/Sidebar.tsx`

**布局结构**：

```typescript
const StyledSider = styled(Sider)`
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 100;
`;

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 64px);
`;

const MainMenu = styled(StyledMenu)`
  flex: 1;
  margin-bottom: auto;
`;

const SettingsMenu = styled(StyledMenu)`
  margin-top: auto;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 12px;
`;
```

**菜单项配置**：

```typescript
const mainMenuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '实时监控'
  },
  {
    key: '/control',
    icon: <ControlOutlined />,
    label: '环境控制'
  },
  {
    key: '/alarms',
    icon: <BellOutlined />,
    label: '报警设置'
  },
  {
    key: '/analysis',
    icon: <LineChartOutlined />,
    label: '数据分析'
  }
];
```

### 3.2 环境控制卡片布局

**位置**：`src/pages/EnvironmentControl.tsx`

**卡片结构**：

```typescript
<Card 
  title={system.name}
  style={{ 
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  }}
  bodyStyle={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }}
>
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <Text>{system.description}</Text>
  
    <div style={{ marginBottom: '16px' }}>
      <Text>影响效果：</Text>
      <ul style={{ minHeight: '80px' }}>
        {system.effects.map(effect => <li>{effect}</li>)}
      </ul>
    </div>

    <div style={{ flex: 1 }}>
      <div style={{ height: '32px' }}>
        <Switch checked={isAuto} />
      </div>
      <div style={{ height: '32px' }}>
        <Slider value={power} />
      </div>
    </div>

    <Text style={{ height: '32px' }}>
      {getCurrentStatus()}
    </Text>
  </div>
</Card>
```

### 3.3 系统设置页面布局

**位置**：`src/pages/Settings.tsx`

**表单结构**：

```typescript
<Form layout="vertical">
  <StyledCard title="基本设置">
    <Form.Item name="autoControl" label="默认自动控制">
      <Switch />
    </Form.Item>
    <Form.Item name="dataUpdateInterval" label="数据更新间隔（秒）">
      <InputNumber min={1} max={60} />
    </Form.Item>
  </StyledCard>

  <StyledCard title="警戒阈值设置">
    <Form.Item name={['warningThreshold', 'temperature']} label="温度警戒值">
      <InputNumber min={0} max={50} addonAfter="℃" />
    </Form.Item>
    // ... 其他阈值设置
  </StyledCard>

  <StyledCard title="系统维护">
    <Space direction="vertical" style={{ width: '100%' }}>
      <Text>数据库大小：{formatBytes(stats.dbSize)}</Text>
      <Text>数据点总数：{stats.totalPoints}</Text>
      <Button type="primary" danger onClick={handleCleanup}>
        清理历史数据（保留一周）
      </Button>
    </Space>
  </StyledCard>
</Form>
```

## 4. 数据更新与状态管理

### 4.1 传感器数据上下文

**位置**：`src/contexts/SensorDataContext.tsx`

**状态管理**：

```typescript
export const SensorDataProvider: React.FC = ({ children }) => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  return (
    <SensorDataContext.Provider value={{ 
      sensorData, 
      isLoading, 
      error,
      getHistoricalData,
      getStorageStats,
      cleanupOldData
    }}>
      {children}
    </SensorDataContext.Provider>
  );
};
```

### 4.2 系统状态管理

**位置**：`src/pages/EnvironmentControl.tsx`

**状态更新逻辑**：

```typescript
useEffect(() => {
  const timer = setInterval(() => {
    setSystems(prev => {
      const newSystems = { ...prev };
      Object.keys(newSystems).forEach(key => {
        if (newSystems[key].isAuto) {
          newSystems[key].currentPower = calculateSystemPower(
            newSystems[key], 
            sensorData
          );
        }
      });
      return newSystems;
    });
  }, 5000);

  return () => clearInterval(timer);
}, [sensorData]);
```

## 5. 系统配置与参数

### 5.1 环境参数阈值

| 参数     | 警戒值 | 目标值 | 单位 | 说明                       |
| -------- | ------ | ------ | ---- | -------------------------- |
| 空气温度 | 30     | 25     | ℃   | 超过警戒值启动通风         |
| 空气湿度 | 80     | 60     | %    | 过高启动通风，过低启动加湿 |
| 光照强度 | 3000   | 2000   | lux  | 过高启动遮阳，过低启动补光 |
| CO2浓度  | 800    | 600    | ppm  | 低于目标值启动补充         |
| 土壤湿度 | 85     | 70     | %    | 低于目标值启动灌溉         |

### 5.2 系统响应参数

- 传感器数据更新：1秒
- 系统状态更新：5秒
- 功率调节最小步进：1%
- 数据库大小限制：100MB
- 数据清理周期：7天
