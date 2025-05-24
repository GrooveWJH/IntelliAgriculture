# 4. 数据生成与仿真

[← 返回文档首页](../README.md)

## 目录导航

- [4.1 传统数据生成模型](#41-传统数据生成模型)
  - [4.1.1 基本原理](#411-基本原理)
  - [4.1.2 实现方式](#412-实现方式)
  - [4.1.3 不同参数的波动配置](#413-不同参数的波动配置)
  - [4.1.4 传统模型的局限性](#414-传统模型的局限性)
- [4.2 基于天气数据驱动的环境模拟](#42-基于天气数据驱动的环境模拟)
  - [4.2.1 核心思想](#421-核心思想)
  - [4.2.2 天气数据服务](#422-天气数据服务)
  - [4.2.3 大棚物理特性模型](#423-大棚物理特性模型)
  - [4.2.4 控制系统效果模型](#424-控制系统效果模型)
  - [4.2.5 历史状态维护机制](#425-历史状态维护机制)
- [4.3 物理模型与计算方法](#43-物理模型与计算方法)
  - [4.3.1 温度计算模型](#431-温度计算模型)
  - [4.3.2 湿度计算模型](#432-湿度计算模型)
  - [4.3.3 CO2浓度计算模型](#433-co2浓度计算模型)
  - [4.3.4 光照强度计算模型](#434-光照强度计算模型)
  - [4.3.5 环境模拟实现示例](#435-环境模拟实现示例)
- [4.4 天气驱动模型的优势与应用](#44-天气驱动模型的优势与应用)
  - [4.4.1 模型比较](#441-模型比较)
  - [4.4.2 天气数据驱动模型的核心优势](#442-天气数据驱动模型的核心优势)
  - [4.4.3 实际应用场景](#443-实际应用场景)

## 相关文档
- [系统概述](../overview/system-overview.md)
- [控制系统设计](../design/control-system-design.md)

---

本章节详细介绍智慧农业大棚控制系统中的环境参数生成和模拟方案，包括传统数据生成模型和基于天气数据驱动的高级环境模拟方法。

## 4.1 传统数据生成模型

系统最初采用基于三角函数的数据生成模型，通过周期性函数模拟环境参数的自然变化。

### 4.1.1 基本原理

传统模型使用正弦波函数和随机噪声来模拟环境参数的周期性变化，基本公式如下：

$$P(t) = P_{base} + A \cdot \sin(\frac{2\pi \cdot (t - \phi)}{T}) + N \cdot random(-1, 1)$$

其中：
- $P(t)$ 是时间 $t$ 处的参数值
- $P_{base}$ 是基础参数值
- $A$ 是振幅
- $T$ 是周期
- $\phi$ 是相位偏移
- $N$ 是噪声幅度
- $random(-1, 1)$ 是范围在 $[-1, 1]$ 内的随机值

### 4.1.2 实现方式

系统中的传感器数据生成器实现了这一模型：

```typescript
// 波动参数配置
interface WaveParams {
  baseValue: number;  // 基础值
  amplitude: number;  // 振幅
  period: number;     // 周期(毫秒)
  phase: number;      // 相位(弧度)
  noiseLevel: number; // 噪声级别(0-1)
}

// 根据波动参数生成一个值
function generateWaveValue(params: WaveParams, timestamp: number): number {
  const { baseValue, amplitude, period, phase, noiseLevel } = params;
  
  // 计算正弦波值
  const sineValue = Math.sin(2 * Math.PI * (timestamp / period + phase));
  
  // 生成随机噪声
  const noise = (Math.random() * 2 - 1) * noiseLevel;
  
  // 计算最终值: 基础值 + 振幅*正弦值 + 振幅*噪声*噪声级别
  return baseValue + amplitude * sineValue + amplitude * noise;
}
```

### 4.1.3 不同参数的波动配置

不同环境参数有各自的变化特性，通过不同的波动参数设置来模拟：

```typescript
// 默认配置参数
export const defaultWaveConfig: SensorWaveConfig = {
  airTemperature: {
    baseValue: 25,   // 基础温度25℃
    amplitude: 5,    // 振幅5℃
    period: 24 * 60 * 60 * 1000, // 24小时周期
    phase: 0,        // 无相位偏移
    noiseLevel: 0.1  // 10%的随机噪声
  },
  airHumidity: {
    baseValue: 70,   // 基础湿度70%
    amplitude: 10,   // 振幅10%
    period: 24 * 60 * 60 * 1000, // 24小时周期
    phase: Math.PI,  // 与温度相反的相位
    noiseLevel: 0.15 // 15%的随机噪声
  },
  // 其他参数配置...
};
```

### 4.1.4 传统模型的局限性

基于三角函数的数据生成模型存在以下明显局限性：

1. **简化过度**：使用简单的正弦波无法反映复杂的环境动态变化
2. **参数孤立**：各参数间相互影响较弱，不符合实际环境中参数间的耦合关系
3. **控制反馈缺失**：控制系统的操作对环境参数的影响体现不充分
4. **外部因素忽略**：没有考虑外部天气等因素对温室环境的影响
5. **物理规律缺失**：未遵循热力学、流体力学等基本物理规律
6. **历史状态缺失**：每次计算都是独立的，不考虑系统的历史状态和连续性

## 4.2 基于天气数据驱动的环境模拟

为克服传统模型的局限性，系统引入了基于天气数据驱动的环境模拟方法，这是系统的一个关键创新点。

### 4.2.1 核心思想

```mermaid
graph TD
    A[外部天气数据] --> E[环境模拟引擎]
    B[大棚物理特性] --> E
    C[控制系统操作] --> E
    D[当前环境状态] --> E
    
    E --> F[新环境状态]
    F --> D
    
    F --> G[传感器数据]
    G --> H[环境控制系统]
    H --> C
```

天气数据驱动的环境模拟核心思想包括：

1. **外部天气影响**：将室外天气作为环境模拟的主要驱动因素
2. **大棚物理建模**：根据大棚的物理特性（保温性、透光率等）建立传热传质模型
3. **控制系统反馈**：将控制系统操作作为模型输入，模拟其对环境的实际影响
4. **参数耦合关系**：考虑不同环境参数之间的相互影响和制约关系
5. **物理规律约束**：模型遵循基本物理规律，如热平衡、湿度平衡等
6. **历史状态保持**：考虑系统的历史状态，确保参数变化的连续性和平滑性

### 4.2.2 天气数据服务

系统包含一个天气数据服务（`WeatherDataService`），用于获取和处理天气数据：

```typescript
// 天气数据接口
interface WeatherData {
  location: string;
  timestamp: number;
  temperature: number;
  humidity: number;
  cloudCover: number;
  precipitation: number;
  windSpeed: number;
  weatherType: string;
  description: string;
}
```

天气数据服务支持两种模式：
1. **实时天气数据**：通过调用外部天气API获取真实天气数据
2. **模拟天气数据**：生成模拟的天气数据，支持不同天气类型的随机变化

### 4.2.3 大棚物理特性模型

系统建立了大棚物理特性模型，描述大棚对环境参数的影响因素：

```typescript
// 大棚物理属性
interface GreenhouseProperties {
  thermalInsulation: number; // 保温性能 (0-1)
  lightTransmission: number; // 光线透过率 (0-1)
  airTightness: number;      // 气密性 (0-1)
  volume: number;            // 体积 (立方米)
  coverageArea: number;      // 覆盖面积 (平方米)
}

// 默认大棚物理属性
const defaultGreenhouseProps: GreenhouseProperties = {
  thermalInsulation: 0.8,    // 较好的保温性能
  lightTransmission: 0.7,    // 70%的光线透过率
  airTightness: 0.9,         // 较好的密封性
  volume: 3000,              // 3000立方米容积
  coverageArea: 1000         // 1000平方米覆盖面积
};
```

### 4.2.4 控制系统效果模型

系统模拟了各控制子系统对环境的影响：

```typescript
// 控制系统效果
interface ControlEffects {
  ventilation: number;      // 通风系统功率 (0-100%)
  heating: number;          // 加热系统功率 (0-100%)
  cooling: number;          // 制冷系统功率 (0-100%)
  humidification: number;   // 加湿系统功率 (0-100%)
  dehumidification: number; // 除湿系统功率 (0-100%)
  lighting: number;         // 补光系统功率 (0-100%)
  irrigation: number;       // 灌溉系统功率 (0-100%)
  co2Injection: number;     // CO2注入系统功率 (0-100%)
}
```

### 4.2.5 历史状态维护机制

系统新增了历史状态维护机制，确保环境参数变化的平滑性和连续性：

```typescript
// 全局状态变量，存储上一时刻的环境参数
let previousIndoorTemperature: number | null = null;
let previousIndoorHumidity: number | null = null;
let previousCO2Level: number | null = null;

// 计算环境参数变化率
interface EnvironmentChanges {
  temperatureChangeRate: number;  // 温度变化率 (℃/分钟)
  humidityChangeRate: number;     // 湿度变化率 (%/分钟)
  co2ChangeRate: number;          // CO2浓度变化率 (ppm/分钟)
}

// 限制参数变化速率，确保自然过渡
function limitChangeRate(
  current: number, 
  previous: number | null, 
  maxRate: number, 
  deltaTime: number
): number {
  if (previous === null) return current;
  
  // 计算实际变化量
  const change = current - previous;
  
  // 计算最大允许变化量（基于时间间隔和最大变化率）
  const maxChange = maxRate * (deltaTime / 60000); // 转换为每分钟
  
  // 限制变化量在允许范围内
  const limitedChange = Math.max(-maxChange, Math.min(maxChange, change));
  
  // 返回限制后的值
  return previous + limitedChange;
}
```

## 4.3 物理模型与计算方法

### 4.3.1 温度计算模型

室内温度计算考虑多个因素，并引入温度历史状态平滑处理：

```typescript
// 温度计算
const calculateIndoorTemperature = (weatherData, controlEffects, previousTemp, deltaTime) => {
  // 使用上一时刻温度作为基础
  let indoorTemp = previousTemp !== null ? previousTemp : weatherData.temperature;
  
  // 计算热量变化率 (dT/dt)
  let deltaT = 0;
  
  // 1. 热传递 - 室内外温差导致的热传递
  deltaT += (weatherData.temperature - indoorTemp) * (1 - greenhouseProps.thermalInsulation) * 0.02;
  
  // 2. 加热系统影响
  deltaT += controlEffects.heating * 0.05 * (deltaTime / 60000);
  
  // 3. 制冷系统影响
  deltaT -= controlEffects.cooling * 0.07 * (deltaTime / 60000);
  
  // 4. 通风系统影响（当室外温度低于室内时制冷，反之加热）
  if (controlEffects.ventilation > 0) {
    const ventEffect = (weatherData.temperature - indoorTemp) * 
                      (controlEffects.ventilation / 100) * 0.03 * (deltaTime / 60000);
    deltaT += ventEffect;
  }
  
  // 5. 太阳辐射影响
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour <= 18;
  if (isDay) {
    const solarEffect = (1 - weatherData.cloudCover) * 
                        greenhouseProps.lightTransmission * 
                        Math.sin((hour - 6) * Math.PI / 12) * 0.1 * (deltaTime / 60000);
    deltaT += solarEffect;
  }
  
  // 更新温度，应用变化率
  indoorTemp += deltaT;
  
  // 限制变化率，确保平滑过渡
  if (previousTemp !== null) {
    indoorTemp = limitChangeRate(indoorTemp, previousTemp, 0.3, deltaTime); // 最大变化率0.3℃/分钟
  }
  
  return indoorTemp;
};
```

### 4.3.2 湿度计算模型

室内湿度考虑以下因素，同样引入历史状态维护：

$$H_{indoor} = H_{outdoor} + \Delta H_{tightness} + \Delta H_{humidification} - \Delta H_{dehumidification} - \Delta H_{ventilation} - \Delta H_{temp}$$

其中：
- $\Delta H_{tightness}$ 是密封性对湿度的影响
- $\Delta H_{humidification}$ 是加湿系统增加的湿度
- $\Delta H_{dehumidification}$ 是除湿系统减少的湿度
- $\Delta H_{ventilation}$ 是通风系统导致的湿度变化
- $\Delta H_{temp}$ 是温度变化对湿度的影响

温度对湿度的影响：

$$\Delta H_{temp} = k \cdot (T_{indoor} - T_{outdoor})$$

其中 $k$ 是比例系数，通常为0.5（温度每上升1℃，相对湿度下降约0.5%）。

### 4.3.3 CO2浓度计算模型

CO2浓度计算：

$$CO2_{indoor} = CO2_{base} - \Delta CO2_{ventilation} + \Delta CO2_{injection} - \Delta CO2_{photosynthesis}$$

其中：
- $CO2_{base}$ 是基础CO2浓度 (约400ppm)
- $\Delta CO2_{ventilation}$ 是通风系统导致的CO2减少
- $\Delta CO2_{injection}$ 是CO2注入系统增加的CO2
- $\Delta CO2_{photosynthesis}$ 是植物光合作用消耗的CO2

光合作用消耗计算：

$$\Delta CO2_{photosynthesis} = P \cdot (1 - C) \cdot L \cdot IsDay$$

其中：
- $P$ 是光合作用强度系数
- $IsDay$ 是白天标志 (0或1)

### 4.3.4 光照强度计算模型

光照强度计算：

$$L_{indoor} = L_{natural} + L_{artificial}$$

自然光计算：

$$L_{natural} = L_{base} \cdot (1 - C) \cdot LT \cdot \sin(\frac{\pi \cdot (h - 6)}{12}) \cdot IsDay$$

其中：
- $L_{base}$ 是基础光照强度
- $LT$ 是光线透过率
- $IsDay$ 是白天标志 (0或1)

人工补光计算：

$$L_{artificial} = P_{lighting} \cdot L_{coefficient}$$

其中：
- $P_{lighting}$ 是补光系统功率百分比
- $L_{coefficient}$ 是光照转换系数

### 4.3.5 环境模拟实现示例

以下是改进后的环境模拟核心实现函数示例，体现了历史状态维护和平滑变化：

```typescript
/**
 * 基于天气数据计算大棚内环境，支持历史状态维护和平滑变化
 * @param weatherData 天气数据
 * @param controlEffects 控制系统效果
 * @returns 大棚内环境参数
 */
export const calculateIndoorEnvironment = (weatherData: WeatherData, controlEffects: ControlEffects) => {
  const { temperature, humidity, cloudCover, precipitation, windSpeed } = weatherData;
  const { thermalInsulation, lightTransmission, airTightness, volume } = greenhouseProps; // 添加 volume
  
  // 温度计算，考虑保温性和控制系统
  // 使用上一时刻的室内温度作为基础（如果存在），否则使用室外温度
  let indoorTemp = previousIndoorTemperature !== null ? previousIndoorTemperature : temperature;
  
  // 热量变化率 (dT/dt)
  let deltaT = 0;
  
  // 计算模拟间隔时间（毫秒）
  const deltaTime = 3000; // 假设模拟周期为3秒
  
  // 热传递 - 室内外温差导致的热传递
  deltaT += (temperature - indoorTemp) * (1 - thermalInsulation) * 0.02;
  
  // 计算控制系统的温度影响
  const heatingEffect = controlEffects.heating * 0.05 * (deltaTime / 60000);
  const coolingEffect = controlEffects.cooling * 0.07 * (deltaTime / 60000);
  
  // 加热和制冷系统影响
  deltaT += heatingEffect - coolingEffect;
  
  // 通风系统影响
  if (controlEffects.ventilation > 0) {
    // 通风导致室内温度向室外温度靠近的速率与通风功率和室内外温差成正比
    const ventEffect = (temperature - indoorTemp) * 
                       (controlEffects.ventilation / 100) * 0.1 * (deltaTime / 60000);
    deltaT += ventEffect;
  }
  
  // 计算当前小时的太阳高度影响
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour <= 18;
  if (isDay) {
    // 太阳高度影响（中午最强）
    const solarHeight = Math.sin((hour - 6) * Math.PI / 12);
    const solarEffect = (1 - cloudCover) * lightTransmission * 5 * solarHeight * (deltaTime / 60000);
    deltaT += solarEffect;
  }
  
  // 应用热量变化率
  indoorTemp += deltaT;
  
  // 限制温度变化率，确保平滑变化
  if (previousIndoorTemperature !== null) {
    indoorTemp = limitChangeRate(indoorTemp, previousIndoorTemperature, 0.3, deltaTime); // 最大0.3℃/分钟
  }
  
  // 存储当前温度以供下次计算使用
  previousIndoorTemperature = indoorTemp;
  
  // 湿度计算，考虑密封性和控制系统
  let indoorHumidity = previousIndoorHumidity !== null ? previousIndoorHumidity : humidity;
  
  // 湿度变化率
  let deltaH = 0;
  
  // 室内外湿度差导致的水分交换
  deltaH += (humidity - indoorHumidity) * (1 - airTightness) * 0.03;
  
  // 雨天湿度影响
  if (precipitation > 0) {
    deltaH += precipitation * (1 - airTightness) * 0.5;
  }
  
  // 控制系统影响
  deltaH += (controlEffects.humidification * 0.3 - controlEffects.dehumidification * 0.3) * (deltaTime / 60000);
  
  // 通风系统对湿度的影响
  if (controlEffects.ventilation > 0) {
    const ventHumidityEffect = (humidity - indoorHumidity) * 
                              (controlEffects.ventilation / 100) * 0.2 * (deltaTime / 60000);
    deltaH += ventHumidityEffect;
  }
  
  // 温度对湿度的反向影响（温度高时湿度降低）
  deltaH -= (indoorTemp - temperature) * 0.5 * (deltaTime / 60000);
  
  // 应用湿度变化率
  indoorHumidity += deltaH;
  
  // 限制湿度变化率，确保平滑变化
  if (previousIndoorHumidity !== null) {
    indoorHumidity = limitChangeRate(indoorHumidity, previousIndoorHumidity, 1.0, deltaTime); // 最大1%/分钟
  }
  
  // 确保湿度在合理范围内
  indoorHumidity = Math.max(30, Math.min(100, indoorHumidity));
  
  // 存储当前湿度以供下次计算使用
  previousIndoorHumidity = indoorHumidity;
  
  // 其他环境参数计算（CO2浓度、光照等）类似添加历史状态维护...
  
  // 返回计算的大棚环境参数
  return {
    timestamp: Date.now(),
    airTemperature: Number(indoorTemp.toFixed(2)),
    airHumidity: Number(indoorHumidity.toFixed(2)),
    co2Level: Number(co2Level.toFixed(2)),
    lightIntensity: Number(lightIntensity.toFixed(2)),
    // ...其他参数
  };
};
```

## 4.4 天气驱动模型的优势与应用

### 4.4.1 模型比较

|特性|传统三角函数模型|天气数据驱动模型|
|---|---|---|
|复杂度|低|中高|
|计算资源需求|低|中|
|环境参数真实性|一般|较高|
|参数间关联性|低|高|
|外部天气影响|无|有|
|控制系统反馈|弱|强|
|历史状态维护|无|有|
|参数变化平滑性|弱|强|
|交互响应自然度|低|高|
|适用场景|原型和演示|实际生产环境|

### 4.4.2 天气数据驱动模型的核心优势

1. **更高的环境仿真真实性**
   - 基于真实天气数据，模拟结果更符合实际情况
   - 考虑外部天气变化对室内环境的影响
   - 生成的数据更贴近真实大棚环境参数变化规律

2. **环境参数的物理关联**
   - 温度、湿度、CO2浓度等参数间存在物理关联
   - 参数变化相互影响，符合自然规律
   - 避免了各参数孤立变化的不真实情况

3. **控制系统的精确反馈**
   - 控制系统操作直接影响环境参数计算
   - 不同控制策略的效果差异可以准确体现
   - 更真实地模拟控制系统对环境的调节过程

4. **历史状态维护与平滑变化**
   - 环境参数变化考虑历史状态，确保连续性
   - 参数变化有物理约束的最大变化率，避免突变
   - 更真实地反映大棚环境的热惯性和状态延续性

5. **改进的用户体验**
   - 控制系统操作与环境响应更加自然流畅
   - 滑块等交互组件的操作直观反映在环境参数上
   - 用户能够更好地理解控制操作与环境变化的关系

6. **场景适应性与扩展性**
   - 通过调整大棚物理参数，可以模拟不同类型的大棚
   - 支持不同气候条件下的环境模拟
   - 便于测试控制算法在各种条件下的表现

7. **提高系统训练与验证价值**
   - 为控制算法优化提供更真实的测试环境
   - 可用于模拟极端天气条件下的系统响应
   - 增强用户对系统行为的预期理解

### 4.4.3 实际应用场景

天气数据驱动的环境模拟方案在以下场景中特别有价值：

1. **系统研发与测试**：在不同天气条件下测试控制策略的有效性
2. **操作人员培训**：模拟各种环境条件，训练操作人员应对不同情况
3. **控制参数优化**：在模拟环境中调整控制参数，找到最优配置
4. **资源消耗评估**：评估不同天气条件下的能源和资源消耗
5. **极端情况预演**：模拟极端天气条件，测试系统应对能力
6. **UI交互优化**：验证用户界面元素（如滑块控制）的自然反馈效果 