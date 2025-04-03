# 环境控制子系统设计与实现

## 1. 环境控制系统架构

自然生态智慧农业大棚控制系统包含多个子系统，各自负责维持特定环境参数在理想范围内：

1. **通风系统**：控制空气温度和湿度
2. **加湿系统**：增加空气湿度
3. **补光系统**：提供植物所需光照
4. **灌溉系统**：维持土壤湿度
5. **CO2系统**：调节二氧化碳浓度
6. **遮阳系统**：防止光照过强

## 2. 环境控制界面

**文件位置**：`src/pages/EnvironmentControl.tsx`

### 2.1 控制系统定义

```typescript
interface ControlSystem {
  name: string;
  description: string;
  effects: string[];
  min: number;
  max: number;
  step: number;
  unit: string;
  type: string;
}
```

### 2.2 控制系统初始化

```typescript
const [systems, setSystems] = useState<{[key: string]: SystemState}>({
  ventilation: {
    isAuto: true,
    manualPower: 0,
    currentPower: 0,
    status: '待机',
  },
  humidification: {
    isAuto: true,
    manualPower: 0,
    currentPower: 0,
    status: '待机',
  },
  lighting: {
    isAuto: true,
    manualPower: 0,
    currentPower: 0,
    status: '待机',
  },
  irrigation: {
    isAuto: true,
    manualPower: 0,
    currentPower: 0,
    status: '待机',
  },
  co2: {
    isAuto: true,
    manualPower: 0,
    currentPower: 0,
    status: '待机',
  },
  shading: {
    isAuto: true,
    manualPower: 0,
    currentPower: 0,
    status: '待机',
  },
});
```

### 2.3 子系统配置

```typescript
const systemConfigs: {[key: string]: ControlSystem} = {
  ventilation: {
    name: '通风系统',
    description: '控制农业大棚内空气流通，调节温度和湿度',
    effects: [
      '降低空气温度',
      '降低空气湿度',
      '增加空气流动',
      '降低CO2浓度'
    ],
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    type: 'ventilation'
  },
  humidification: {
    name: '加湿系统',
    description: '增加空气湿度，创造适宜植物生长的环境',
    effects: [
      '增加空气湿度',
      '轻微降低温度'
    ],
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    type: 'humidification'
  },
  // 其他系统配置...
};
```

## 3. 通风系统

通风系统使用 Smith 预测控制器，适合处理大延迟特性的系统。

### 3.1 控制逻辑

```typescript
calculateVentilationControl(sensorData: SensorData): SystemOutput {
  const controller = this.controllers.get('ventilation');
  const tempError = sensorData.airTemperature - environmentConfig.airTemperature.target;
  const humidityError = sensorData.airHumidity - environmentConfig.airHumidity.target;
  
  // 使用较大的误差作为控制输入
  const error = Math.max(
    tempError / (environmentConfig.airTemperature.warningThreshold - environmentConfig.airTemperature.target),
    humidityError / (environmentConfig.airHumidity.warningThreshold - environmentConfig.airHumidity.target)
  ) * 100;

  const power = controller.calculate(0, error);
  
  return {
    power,
    status: this.getVentilationStatus(sensorData),
    controlMode: 'smith'
  };
}
```

### 3.2 状态判断

```typescript
private getVentilationStatus(data: SensorData): string {
  const tempDiff = data.airTemperature - environmentConfig.airTemperature.target;
  const humidityDiff = data.airHumidity - environmentConfig.airHumidity.target;
  
  if (tempDiff > 2 || humidityDiff > 10) {
    return '运行中 - 调节环境';
  } else if (Math.abs(tempDiff) <= 1 && Math.abs(humidityDiff) <= 5) {
    return '待机 - 环境正常';
  } else {
    return '低速运行 - 维持环境';
  }
}
```

### 3.3 系统特性

- **延迟特性**：通风对农业大棚环境的影响有明显延迟，需要预测控制
- **多参数影响**：同时影响温度、湿度和CO2浓度
- **功率控制**：通过无级调速风机实现精确控制

## 4. 加湿系统

加湿系统使用模糊控制器，适合处理非线性特性的系统。

### 4.1 控制逻辑

```typescript
calculateHumidificationControl(sensorData: SensorData): SystemOutput {
  const controller = this.controllers.get('humidification');
  const error = environmentConfig.airHumidity.target - sensorData.airHumidity;
  const errorChange = this.getErrorChange('humidification', error);
  
  const power = controller.calculate(error, errorChange);
  
  return {
    power,
    status: this.getHumidificationStatus(sensorData),
    controlMode: 'fuzzy'
  };
}
```

### 4.2 状态判断

```typescript
private getHumidificationStatus(data: SensorData): string {
  const humidityDiff = environmentConfig.airHumidity.target - data.airHumidity;
  
  if (humidityDiff > 10) {
    return '高速运行 - 快速加湿';
  } else if (humidityDiff > 5) {
    return '运行中 - 加湿';
  } else if (humidityDiff > 0) {
    return '低速运行 - 维持湿度';
  } else {
    return '待机 - 湿度充足';
  }
}
```

### 4.3 系统特性

- **非线性响应**：加湿效果与当前湿度呈非线性关系
- **温度影响**：会轻微降低环境温度
- **局部效应**：加湿效果在空间分布上不均匀

## 5. 补光系统

补光系统使用 PID 控制器，适合处理线性特性的系统。

### 5.1 控制逻辑

```typescript
calculateLightingControl(sensorData: SensorData): SystemOutput {
  const controller = this.controllers.get('lighting');
  const power = controller.calculate(
    environmentConfig.lightIntensity.target,
    sensorData.lightIntensity
  );
  
  return {
    power,
    status: this.getLightingStatus(sensorData),
    controlMode: 'pid'
  };
}
```

### 5.2 状态判断

```typescript
private getLightingStatus(data: SensorData): string {
  const lightDiff = environmentConfig.lightIntensity.target - data.lightIntensity;
  
  if (lightDiff > 500) {
    return '全功率运行 - 补光';
  } else if (lightDiff > 200) {
    return '运行中 - 补充光照';
  } else if (lightDiff > 0) {
    return '低功率运行 - 维持光照';
  } else {
    return '待机 - 光照充足';
  }
}
```

### 5.3 系统特性

- **快速响应**：光照强度可以快速调整
- **能耗管理**：根据自然光照强度自动调整人工光照
- **光谱选择**：LED补光可优化植物所需光谱

## 6. 灌溉系统

灌溉系统使用模糊控制器，适合处理非线性特性和多参数影响的系统。

### 6.1 控制逻辑

```typescript
calculateIrrigationControl(sensorData: SensorData): SystemOutput {
  const controller = this.controllers.get('irrigation');
  const moistureError = environmentConfig.soilMoisture.target - sensorData.soilMoisture;
  const tempFactor = (sensorData.soilTemperature - environmentConfig.soilTemperature.min) / 
                    (environmentConfig.soilTemperature.max - environmentConfig.soilTemperature.min);
  
  // 考虑温度因素调整误差
  const adjustedError = moistureError * (1 + 0.5 * tempFactor);
  const errorChange = this.getErrorChange('irrigation', adjustedError);
  
  const power = controller.calculate(adjustedError, errorChange);
  
  return {
    power,
    status: this.getIrrigationStatus(sensorData),
    controlMode: 'fuzzy'
  };
}
```

### 6.2 状态判断

```typescript
private getIrrigationStatus(data: SensorData): string {
  const moistureDiff = environmentConfig.soilMoisture.target - data.soilMoisture;
  
  if (moistureDiff > 15) {
    return '高速灌溉 - 土壤干燥';
  } else if (moistureDiff > 5) {
    return '灌溉中 - 补充水分';
  } else if (moistureDiff > 0) {
    return '低速灌溉 - 维持湿度';
  } else {
    return '待机 - 水分充足';
  }
}
```

### 6.3 系统特性

- **滞后响应**：灌溉后土壤湿度变化有滞后性
- **区域不均**：不同区域的土壤湿度可能存在差异
- **多参数影响**：受土壤温度、空气湿度等多因素影响

## 7. CO2系统

CO2系统使用 PID 控制器，适合处理线性特性的系统。

### 7.1 控制逻辑

```typescript
calculateCO2Control(sensorData: SensorData): SystemOutput {
  const controller = this.controllers.get('co2');
  const error = environmentConfig.co2Level.target - sensorData.co2Level;
  
  // 只在CO2浓度低于目标值时工作
  const power = error > 0 ? controller.calculate(
    environmentConfig.co2Level.target,
    sensorData.co2Level
  ) : 0;
  
  return {
    power,
    status: this.getCO2Status(sensorData),
    controlMode: 'pid'
  };
}
```

### 7.2 状态判断

```typescript
private getCO2Status(data: SensorData): string {
  const co2Diff = environmentConfig.co2Level.target - data.co2Level;
  
  if (co2Diff > 100) {
    return '高速补充 - CO2不足';
  } else if (co2Diff > 50) {
    return '补充中 - 提升CO2浓度';
  } else if (co2Diff > 0) {
    return '低速补充 - 维持CO2浓度';
  } else if (data.co2Level > environmentConfig.co2Level.warningThreshold) {
    return '待机 - CO2浓度过高';
  } else {
    return '待机 - CO2浓度正常';
  }
}
```

### 7.3 系统特性

- **快速扩散**：CO2在空气中扩散迅速
- **浓度监测**：需要精确的CO2传感器
- **安全控制**：避免CO2浓度过高造成安全问题

## 8. 遮阳系统

遮阳系统使用 PID 控制器，适合处理线性特性的系统。

### 8.1 控制逻辑

```typescript
calculateShadingControl(sensorData: SensorData): SystemOutput {
  const controller = this.controllers.get('shading');
  const error = sensorData.lightIntensity - environmentConfig.lightIntensity.max;
  
  // 只在光照强度超过最大值时工作
  const power = error > 0 ? controller.calculate(
    environmentConfig.lightIntensity.max,
    sensorData.lightIntensity
  ) : 0;
  
  return {
    power,
    status: this.getShadingStatus(sensorData),
    controlMode: 'pid'
  };
}
```

### 8.2 状态判断

```typescript
private getShadingStatus(data: SensorData): string {
  const lightDiff = data.lightIntensity - environmentConfig.lightIntensity.max;
  
  if (lightDiff > 500) {
    return '全部遮阳 - 光照过强';
  } else if (lightDiff > 200) {
    return '部分遮阳 - 降低光照';
  } else if (lightDiff > 0) {
    return '轻度遮阳 - 调节光照';
  } else {
    return '待机 - 光照适宜';
  }
}
```

### 8.3 系统特性

- **物理调节**：通过遮阳网物理调节光照强度
- **温度影响**：遮阳同时降低大棚内温度
- **分区控制**：可实现分区遮阳控制

## 9. 环境控制系统工作流程

### 9.1 自动模式

1. 传感器采集实时环境数据
2. 控制系统根据偏差计算各子系统输出功率
3. 子系统根据功率自动调整工作状态
4. 环境参数变化，形成闭环控制

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

### 9.2 手动模式

用户可手动调整各子系统功率，适用于特殊情况下的人工干预：

```typescript
const handlePowerChange = (system: string, power: number) => {
  setSystems(prev => ({
    ...prev,
    [system]: {
      ...prev[system],
      manualPower: power,
      currentPower: power,
    }
  }));
};

const handleModeChange = (system: string, isAuto: boolean) => {
  setSystems(prev => {
    const current = { ...prev[system] };
    if (isAuto) {
      // 切换到自动模式时，重置为系统计算的功率
      current.currentPower = calculateSystemPower(current, sensorData);
    } else {
      // 切换到手动模式时，使用当前功率作为初始手动功率
      current.manualPower = current.currentPower;
    }
    return {
      ...prev,
      [system]: {
        ...current,
        isAuto,
      }
    };
  });
};
```

### 9.3 功率计算

```typescript
const calculateSystemPower = (system: SystemState, data: SensorData | null): number => {
  if (!data) return 0;
  
  // 根据系统类型和传感器数据计算所需功率
  const systemType = system.type as string;
  
  switch (systemType) {
    case 'ventilation':
      return controlSystem.calculateVentilationControl(data).power;
    case 'humidification':
      return controlSystem.calculateHumidificationControl(data).power;
    case 'lighting':
      return controlSystem.calculateLightingControl(data).power;
    case 'irrigation':
      return controlSystem.calculateIrrigationControl(data).power;
    case 'co2':
      return controlSystem.calculateCO2Control(data).power;
    case 'shading':
      return controlSystem.calculateShadingControl(data).power;
    default:
      return 0;
  }
};
```

## 10. 系统能效优化策略

### 10.1 能源使用优先级

系统根据能源消耗和环境影响设定不同子系统的优先级：

1. **高优先级**：对植物生长影响最直接的系统（灌溉、CO2）
2. **中优先级**：基本环境调节系统（通风、补光）
3. **低优先级**：辅助环境调节系统（加湿、遮阳）

### 10.2 系统协同控制

系统在控制决策时考虑子系统间的相互影响，实现协同控制：

```typescript
const optimizeSystemControl = (systems: {[key: string]: SystemState}, data: SensorData): {[key: string]: SystemState} => {
  const optimized = { ...systems };
  
  // 温度过高时，先启动通风再启动遮阳
  if (data.airTemperature > environmentConfig.airTemperature.warningThreshold) {
    if (optimized.ventilation.currentPower < 80) {
      optimized.ventilation.currentPower = Math.min(optimized.ventilation.currentPower + 20, 100);
    } else {
      optimized.shading.currentPower = Math.min(optimized.shading.currentPower + 30, 100);
    }
  }
  
  // 湿度过低时，减少通风增加加湿
  if (data.airHumidity < environmentConfig.airHumidity.min + 5) {
    optimized.ventilation.currentPower = Math.max(optimized.ventilation.currentPower - 20, 0);
    optimized.humidification.currentPower = Math.min(optimized.humidification.currentPower + 30, 100);
  }
  
  return optimized;
};
```

### 10.3 节能运行模式

系统提供节能运行模式，在满足基本环境需求的前提下降低能源消耗：

```typescript
const energySavingMode = (systems: {[key: string]: SystemState}): {[key: string]: SystemState} => {
  const reduced = { ...systems };
  
  Object.keys(reduced).forEach(key => {
    // 保持基本功能，降低功率
    if (reduced[key].currentPower > 0) {
      reduced[key].currentPower = Math.max(reduced[key].currentPower * 0.7, 20);
    }
  });
  
  return reduced;
};
```
