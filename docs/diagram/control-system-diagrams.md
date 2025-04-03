# 自然生态智慧农业大棚控制系统架构图

本文档集中展示了系统中的控制系统架构和工作流程图，帮助理解系统的控制逻辑。

## 1. 控制系统整体架构

```mermaid
graph TD
    subgraph 控制系统架构
        CF[控制器工厂]
        PID[PID控制器]
        FC[模糊控制器]
        SC[Smith预测控制器]
        
        VS[通风子系统]
        HS[加湿子系统]
        LS[补光子系统]
        IS[灌溉子系统]
        CS[CO2子系统]
        SS[遮阳子系统]
        
        PC[参数配置]
    end
    
    CF --> PID
    CF --> FC
    CF --> SC
    
    PID --> LS
    PID --> CS
    PID --> SS
    
    FC --> HS
    FC --> IS
    
    SC --> VS
    
    PC --> PID
    PC --> FC
    PC --> SC
```

## 2. PID控制器工作流程

```mermaid
sequenceDiagram
    participant S as 传感器数据
    participant P as PID控制器
    participant A as 执行器
    
    S->>P: 提供当前值
    Note over P: 计算误差 = 目标值 - 当前值
    Note over P: 计算积分项 += 误差 * dt
    Note over P: 计算微分项 = (误差 - 上次误差) / dt
    Note over P: 输出 = Kp * 误差 + Ki * 积分项 + Kd * 微分项
    P->>A: 功率输出(0-100%)
    A->>S: 影响环境参数
```

## 3. 模糊控制器工作流程

```mermaid
flowchart TD
    A[传感器数据] --> B[计算误差]
    B --> C[计算误差变化率]
    
    C --> D[隶属度计算]
    D --> E[模糊规则计算]
    E --> F[解模糊化]
    
    F --> G[功率输出]
    G --> H[执行器]
    H --> I[环境参数变化]
    I --> A
```

## 4. Smith预测控制器工作流程

```mermaid
flowchart TD
    A[传感器数据] --> B[PID控制]
    B --> C[系统模型预测]
    C --> D[误差补偿]
    D --> E[控制输出]
    
    E --> F[执行器]
    F --> G[真实系统]
    G --> H[环境参数变化]
    H --> A
    
    E --> I[延迟模型]
    I --> J[输出预测]
    J --> D
```

## 5. 子系统控制特性

```mermaid
graph LR
    subgraph 控制算法选择
        PID[PID控制] --> |线性系统| A[补光系统]
        PID --> |线性系统| B[CO2系统]
        PID --> |线性系统| C[遮阳系统]
        
        FUZ[模糊控制] --> |非线性系统| D[加湿系统]
        FUZ --> |非线性系统| E[灌溉系统]
        
        SMI[Smith预测控制] --> |大延迟系统| F[通风系统]
    end
```

## 6. 环境参数与控制系统关系

```mermaid
graph TD
    subgraph 环境参数
        Temp[空气温度]
        Humid[空气湿度]
        Soil[土壤湿度]
        Light[光照强度]
        CO2[CO2浓度]
    end
    
    subgraph 控制系统
        Vent[通风系统]
        Humidifier[加湿系统]
        Lighting[补光系统]
        Irrigation[灌溉系统]
        CO2Sys[CO2系统]
        Shading[遮阳系统]
    end
    
    Temp -->|过高| Vent
    Temp -->|稳定| Vent
    
    Humid -->|过低| Humidifier
    Humid -->|过高| Vent
    
    Soil -->|过低| Irrigation
    
    Light -->|过低| Lighting
    Light -->|过高| Shading
    
    CO2 -->|过低| CO2Sys
```

## 7. 控制决策流程

```mermaid
stateDiagram-v2
    [*] --> 初始化
    初始化 --> 数据采集
    数据采集 --> 偏差计算
    偏差计算 --> 控制算法选择
    
    控制算法选择 --> PID控制
    控制算法选择 --> 模糊控制
    控制算法选择 --> Smith预测控制
    
    PID控制 --> 功率计算
    模糊控制 --> 功率计算
    Smith预测控制 --> 功率计算
    
    功率计算 --> 输出限制
    输出限制 --> 系统执行
    系统执行 --> 数据采集
```

## 8. 控制系统协同工作

```mermaid
graph TD
    subgraph 数据流
        Sensor[传感器数据] --> Processing[数据处理]
        Processing --> Analysis[分析决策]
        Analysis --> Control[控制执行]
        Control --> Environment[环境变化]
        Environment --> Sensor
    end
    
    subgraph 协同控制
        Vent[通风]
        Humid[加湿]
        Light[补光]
        Shade[遮阳]
        
        Vent <-->|温度湿度协调| Humid
        Light <-->|光照协调| Shade
    end
``` 