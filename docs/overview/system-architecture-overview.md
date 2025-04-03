# 自然生态智慧农业大棚控制系统概览

## 一、系统设计

### 1.1 总体架构设计

自然生态智慧农业大棚控制系统采用分层架构设计，通过多个模块协同工作，实现智能化环境监控与控制：

```mermaid
flowchart TD
    subgraph Frontend["前端视图层"]
        A1[实时监控模块] 
        A2[环境控制模块]
        A3[数据分析模块]
        A4[系统设置]
    end
  
    subgraph DataProcessing["数据处理层"]
        B1[传感器数据上下文]
        B2[控制系统服务]
        B3[时序数据存储服务]
    end
  
    subgraph Storage["数据存储层"]
        C1[内存缓存存储]
        C2[IndexedDB持久化存储]
        C3[配置数据存储]
    end
  
    A1 --> B1
    A2 --> B2
    A3 --> B3
    A4 --> B2
  
    B1 --> C1
    B2 --> C3
    B3 --> C2
  
    C1 --> C2
```

### 1.2 系统功能模块设计

#### 1.2.1 前端视图层

用户界面包含四个主要部分：

1. **实时监控面板**：展示农业大棚环境实时数据，包括各类传感器数据和设备状态。提供数据可视化展示，支持参数变化趋势图表和警报显示。
2. **环境控制面板**：提供各环境控制子系统的操作界面，包括通风、加湿、补光、灌溉、CO2控制和遮阳系统的自动/手动控制。
3. **数据分析中心**：提供历史数据查询、统计分析和趋势预测功能，支持多种图表展示和导出选项。
4. **系统设置界面**：提供系统参数配置、用户偏好设置和高级选项，支持自定义控制策略和报警阈值。

#### 1.2.2 数据处理层

数据处理层负责系统核心逻辑：

1. **实时监控模块**：负责传感器数据采集、处理和分发，实现数据实时可视化和异常监测。
2. **环境控制模块**：实现各控制子系统的逻辑，根据环境参数和设定目标，计算控制输出，调节农业大棚环境。
3. **数据处理与分析**：处理历史数据，提供统计分析、相关性分析和预测分析功能，支持决策优化。
4. **配置管理模块**：管理系统配置参数，包括控制参数、用户偏好和系统设置，确保配置数据的一致性。

#### 1.2.3 数据存储层

数据存储层实现数据持久化：

1. **内存缓存**：存储实时数据和临时计算结果，提高系统响应速度。采用多级缓存策略，优化性能。
2. **本地数据库**：基于IndexedDB实现，存储历史传感器数据、控制记录、报警日志和系统配置。

### 1.3 控制算法选型设计

系统根据不同控制对象的特性，选择了多种控制算法进行环境调控：

| 控制对象 | 算法选择      | 选择理由                               |
| -------- | ------------- | -------------------------------------- |
| 补光系统 | PID控制       | 线性特性明显，经典PID算法足以应对      |
| 通风系统 | Smith预测控制 | 具有大延迟特性，需要预测控制           |
| 加湿系统 | 模糊控制      | 非线性特性明显，模糊控制适应性更强     |
| 灌溉系统 | 模糊控制      | 多参数影响，存在不确定性，适合模糊控制 |
| CO2系统  | PID控制       | 浓度变化较为线性，PID控制稳定可靠      |
| 遮阳系统 | Smith预测控制 | 操作与效果之间存在延迟，需要预测控制   |

### 1.4 数据存储策略设计

系统采用多层数据存储策略，平衡性能和存储空间：

```mermaid
graph TD
    A[原始数据] --> B{数据年龄?}
    B -->|1小时内| C[原始精度保存]
    B -->|1天内| D[每分钟采样]
    B -->|1周内| E[每10分钟采样]
    B -->|更早| F[每小时采样]
  
    C --> G[内存缓存]
    D --> G
    G --> H[本地数据库]
    E --> H
    F --> H
```

针对不同时间跨度的数据采用不同的存储精度，最近数据保留更高精度，历史数据进行降采样，平衡存储空间和查询性能。

### 1.5 组件依赖设计

```mermaid
graph TD
    A[App] --> B[Layout]
    B --> C[Dashboard]
    B --> D[ControlPanel]
    B --> E[DataAnalysis]
    B --> F[Settings]
  
    C --> G[SensorDataContext]
    D --> G
    E --> G
  
    G --> H[TimeSeriesStorage]
    G --> I[AlarmService]
  
    D --> J[ControllerFactory]
    J --> K[PIDController]
    J --> L[FuzzyController]
    J --> M[SmithController]
  
    H --> N[IndexedDBService]
    I --> N
```

### 1.6 数据流设计

系统的数据流主要包含以下路径：

```mermaid
flowchart LR
    Sensors[传感器] --> SensorContext[SensorDataContext]
    SensorContext --> Monitor[监控显示]
    SensorContext --> Control[控制决策]
  
    UI[用户界面] --> ControlService[控制系统服务]
    ControlService --> Subsystems[各子系统]
  
    SensorData[传感器数据] --> Storage[时序数据存储]
    Storage --> Cache[内存缓存]
    Storage --> DB[IndexedDB]
  
    UISettings[用户界面] --> SettingsContext[设置上下文]
    SettingsContext --> ConfigStorage[配置存储]
```

### 1.7 系统部署架构设计

系统设计为单页应用（SPA），部署架构如下：

```mermaid
flowchart LR
    WebServer[Web服务器\n静态资源] <--> Browser[浏览器\nSPA应用]
    Browser <--> IndexedDB[IndexedDB\n本地数据存储]
```

## 二、系统实现

### 2.1 技术栈选择

#### 2.1.1 前端技术

- **框架**：React + TypeScript
- **UI组件**：Ant Design
- **状态管理**：React Context API
- **数据可视化**：Echarts
- **样式管理**：Styled Components / CSS Modules

#### 2.1.2 数据存储

- **内存缓存**：JavaScript Map/Array
- **持久化存储**：IndexedDB (通过idb库)
- **配置存储**：LocalStorage

#### 2.1.3 开发工具

- **构建工具**：Webpack / Vite
- **代码质量**：ESLint + Prettier
- **测试框架**：Jest + React Testing Library

### 2.2 状态管理实现

系统通过 React Context API 实现全局状态管理：

```typescript
// 传感器数据上下文
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

// 系统设置上下文
const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  resetSettings: () => {},
});
```

### 2.3 关键算法伪代码

#### 2.3.1 数据采样与存储算法

```
Function shouldStore(timestamp):
    currentTime = getCurrentTime()
    age = currentTime - timestamp
  
    if age ≤ 60秒 then
        return true
    else if age ≤ 60分钟 then
        return timestamp % 60秒 == 0
    else if age ≤ 24小时 then
        return timestamp % 30分钟 == 0
    else if age ≤ 30天 then
        return timestamp % 60分钟 == 0
    else
        return false
```

#### 2.3.2 控制系统选择算法

```
Function selectController(subsystemType):
    switch subsystemType:
        case "ventilation":
            return new SmithPredictor()
        case "humidification":
        case "irrigation":
            return new FuzzyController()
        case "lighting":
        case "co2":
        case "shading":
            return new PIDController()
        default:
            throw "Unknown subsystem type"
```

### 2.4 部署注意事项

1. **离线支持**：系统支持离线运行，数据保存在本地
2. **兼容性**：支持现代浏览器，推荐Chrome 80+/Firefox 75+/Edge 80+
3. **响应式设计**：支持PC端和移动端访问

### 2.5 未来扩展实现

系统设计考虑了未来可能的扩展方向：

1. **远程监控**：添加服务器端组件，支持远程监控与控制
2. **多设备协同**：支持多设备数据同步与控制
3. **AI预测**：集成机器学习模型，预测环境变化和作物生长
4. **硬件接口**：添加实际硬件传感器和控制设备的接口

#### 2.5.1 扩展接口预留

```typescript
// 远程数据接口
interface RemoteDataService {
  fetchSensorData(): Promise<SensorData[]>;
  sendControlCommand(system: string, command: ControlCommand): Promise<void>;
  syncSettings(settings: SystemSettings): Promise<void>;
}

// AI预测接口
interface PredictionService {
  predictEnvironment(current: SensorData, hours: number): Promise<SensorData[]>;
  suggestOptimalSettings(plantType: string): Promise<Partial<SystemSettings>>;
}
```

## 三、技术文档导航

- [数据存储机制](./data-storage-mechanism.md)
- [控制系统架构](./control-system-architecture.md)
- [实时监控系统](./real-time-monitoring-system.md)
- [环境控制子系统](./environmental-control-subsystems.md)
