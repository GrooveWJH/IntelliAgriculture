import React, { useState, useEffect } from 'react';
import { Card, Switch, Slider, Typography, Space, Row, Col, Alert, Spin } from 'antd';
import { parameterConfig } from './Dashboard';
import { useSensorData } from '../contexts/SensorDataContext';

const { Title, Text, Paragraph } = Typography;

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

const controlSystems: ControlSystem[] = [
  {
    name: '通风系统',
    description: '控制温室内空气流通，调节温度和湿度',
    effects: [
      '降低空气温度',
      '降低空气湿度',
      '调节CO2浓度'
    ],
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    type: 'ventilation'
  },
  {
    name: '加湿系统',
    description: '调节空气湿度，保持适宜的生长环境',
    effects: [
      '提高空气湿度',
      '轻微降低温度'
    ],
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    type: 'humidification'
  },
  {
    name: '补光系统',
    description: '在自然光不足时提供补充光照',
    effects: [
      '增加光照强度',
      '影响温度'
    ],
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    type: 'lighting'
  },
  {
    name: '灌溉系统',
    description: '控制土壤水分和养分供应',
    effects: [
      '调节土壤湿度',
      '影响土壤温度',
      '调节EC值'
    ],
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    type: 'irrigation'
  },
  {
    name: 'CO2补充系统',
    description: '调节温室内CO2浓度',
    effects: [
      '提高CO2浓度'
    ],
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    type: 'co2'
  },
  {
    name: '遮阳系统',
    description: '控制阳光辐射强度',
    effects: [
      '降低光照强度',
      '降低温度'
    ],
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    type: 'shading'
  }
];

interface SystemState {
  mode: 'auto' | 'manual';
  level: number;
  isAuto: boolean;
  currentPower: number;
  type: string;
}

const calculateSystemLevel = (sensorData: any, systemName: string): number => {
  if (!sensorData) return 0;
  
  switch (systemName) {
    case '通风系统':
      // 当温度或湿度超过警戒值时启动
      const tempFactor = Math.max(0, (sensorData.airTemperature - parameterConfig.airTemperature.warningThreshold) / 5);
      const humidityFactor = Math.max(0, (sensorData.airHumidity - parameterConfig.airHumidity.warningThreshold) / 10);
      return Math.min(100, Math.max(tempFactor, humidityFactor) * 100);

    case '加湿系统':
      // 当湿度低于60%时启动
      const targetHumidity = 60;
      return sensorData.airHumidity < targetHumidity 
        ? Math.min(100, (targetHumidity - sensorData.airHumidity) * 5)
        : 0;

    case '补光系统':
      // 当光照强度低于2000lux时启动
      const targetLight = 2000;
      return sensorData.lightIntensity < targetLight
        ? Math.min(100, ((targetLight - sensorData.lightIntensity) / targetLight) * 100)
        : 0;

    case '灌溉系统':
      // 当土壤湿度低于65%时启动
      const targetSoilMoisture = 65;
      return sensorData.soilMoisture < targetSoilMoisture
        ? Math.min(100, (targetSoilMoisture - sensorData.soilMoisture) * 3)
        : 0;

    case 'CO2补充系统':
      // 当CO2浓度低于600ppm时启动
      const targetCO2 = 600;
      return sensorData.co2Level < targetCO2
        ? Math.min(100, ((targetCO2 - sensorData.co2Level) / targetCO2) * 100)
        : 0;

    case '遮阳系统':
      // 当光照强度超过2500lux时启动
      return sensorData.lightIntensity > parameterConfig.lightIntensity.warningThreshold
        ? Math.min(100, ((sensorData.lightIntensity - parameterConfig.lightIntensity.warningThreshold) / 1000) * 100)
        : 0;

    default:
      return 0;
  }
};

const calculateSystemPower = (systemState: SystemState, sensorData: any) => {
  if (!systemState.isAuto) {
    return systemState.currentPower;
  }

  const { type } = systemState;
  switch (type) {
    case 'ventilation':
      // 根据温度、湿度和CO2浓度计算通风功率
      const tempDiff = sensorData.airTemperature - parameterConfig.airTemperature.target;
      const humidityDiff = sensorData.airHumidity - parameterConfig.airHumidity.target;
      const co2Diff = sensorData.co2Level - parameterConfig.co2Level.target;
      
      if (tempDiff > 2 || humidityDiff > 10 || Math.abs(co2Diff) > 200) {
        return Math.min(100, Math.max(30, 
          Math.max(
            tempDiff > 0 ? tempDiff * 20 : 0,
            humidityDiff > 0 ? humidityDiff * 5 : 0,
            Math.abs(co2Diff) > 200 ? 30 : 0
          )
        ));
      }
      return 0;

    case 'humidification':
      // 根据湿度差值计算加湿功率
      const humidityDeficit = parameterConfig.airHumidity.target - sensorData.airHumidity;
      if (humidityDeficit > 5) {
        return Math.min(100, humidityDeficit * 8);
      }
      return 0;

    case 'lighting':
      // 根据光照差值计算补光功率
      const lightDeficit = parameterConfig.lightIntensity.target - sensorData.lightIntensity;
      if (lightDeficit > 200) {
        return Math.min(100, (lightDeficit / 20));
      }
      return 0;

    case 'irrigation':
      // 根据土壤湿度差值计算灌溉功率
      const moistureDeficit = parameterConfig.soilMoisture.target - sensorData.soilMoisture;
      if (moistureDeficit > 5) {
        return Math.min(100, moistureDeficit * 10);
      }
      return 0;

    case 'co2':
      // 根据CO2浓度差值计算补充功率
      const co2Deficit = parameterConfig.co2Level.target - sensorData.co2Level;
      if (co2Deficit > 50) {
        return Math.min(100, co2Deficit / 5);
      }
      return 0;

    case 'shading':
      // 根据光照强度计算遮阳功率
      const excessLight = sensorData.lightIntensity - (parameterConfig.lightIntensity.target * 1.2);
      if (excessLight > 0) {
        return Math.min(100, (excessLight / 20));
      }
      return 0;

    default:
      return 0;
  }
};

const EnvironmentControl: React.FC = () => {
  const [masterAutoControl, setMasterAutoControl] = useState(true);
  const [systems, setSystems] = useState<Record<string, SystemState>>({});
  const { sensorData, isLoading, error } = useSensorData();

  // 初始化系统状态
  useEffect(() => {
    const initialSystems: Record<string, SystemState> = {};
    controlSystems.forEach(system => {
      initialSystems[system.name] = {
        mode: 'auto',
        level: 0,
        isAuto: true,
        currentPower: 0,
        type: system.type
      };
    });
    setSystems(initialSystems);
  }, []);

  // 检查所有子系统状态并同步全自动控制状态
  useEffect(() => {
    if (Object.keys(systems).length === 0) return;
    
    const allSystemsAuto = Object.values(systems).every(system => system.isAuto);
    if (masterAutoControl && !allSystemsAuto) {
      // 如果主控制是开启状态，但有子系统不是自动模式，则同步所有子系统为自动模式
      const newSystems = { ...systems };
      Object.keys(newSystems).forEach(systemName => {
        newSystems[systemName].isAuto = true;
        newSystems[systemName].mode = 'auto';
      });
      setSystems(newSystems);
    } else if (!masterAutoControl && allSystemsAuto) {
      // 如果主控制是关闭状态，但所有子系统都是自动模式，则同步主控制状态
      setMasterAutoControl(true);
    }
  }, [systems, masterAutoControl]);

  // 自动控制逻辑
  useEffect(() => {
    if (sensorData) {
      const newSystems = { ...systems };
      Object.keys(newSystems).forEach(systemName => {
        if (newSystems[systemName].isAuto) {
          newSystems[systemName].level = calculateSystemLevel(sensorData, systemName);
          newSystems[systemName].currentPower = calculateSystemPower(newSystems[systemName], sensorData);
        }
      });
      setSystems(newSystems);
    }
  }, [sensorData, systems]);

  const handleSystemAutoChange = (systemName: string, isAuto: boolean) => {
    setSystems(prev => ({
      ...prev,
      [systemName]: {
        ...prev[systemName],
        isAuto,
        mode: isAuto ? 'auto' : 'manual',
        currentPower: prev[systemName].currentPower
      }
    }));
  };

  const handlePowerChange = (systemName: string, power: number) => {
    setSystems(prev => ({
      ...prev,
      [systemName]: {
        ...prev[systemName],
        currentPower: power
      }
    }));
  };

  const handleMasterAutoControl = (checked: boolean) => {
    const newSystems = { ...systems };
    Object.keys(newSystems).forEach(systemName => {
      newSystems[systemName].isAuto = checked;
      newSystems[systemName].mode = checked ? 'auto' : 'manual';
    });
    setSystems(newSystems);
    setMasterAutoControl(checked);
  };

  const getCurrentStatus = (system: ControlSystem) => {
    const systemState = systems[system.name];
    if (!systemState || systemState.currentPower === 0) {
      return "系统待机中 - 当前环境参数在理想范围内";
    }
    
    // 如果没有传感器数据，显示加载状态
    if (!sensorData) {
      return "正在加载数据...";
    }
    
    switch (system.type) {
      case 'ventilation':
        if (sensorData.airTemperature > parameterConfig.airTemperature.target) {
          return `正在降温 - 目标温度${parameterConfig.airTemperature.target.toFixed(1)}°C（当前${sensorData.airTemperature.toFixed(1)}°C）`;
        } else if (sensorData.airHumidity > parameterConfig.airHumidity.target) {
          return `正在降低湿度 - 目标湿度${parameterConfig.airHumidity.target.toFixed(1)}%（当前${sensorData.airHumidity.toFixed(1)}%）`;
        }
        return `正在调节空气流通 - 维持CO2浓度平衡（功率：${systemState.currentPower.toFixed(1)}%）`;
        
      case 'humidification':
        if (sensorData.airHumidity < parameterConfig.airHumidity.target) {
          return `正在加湿 - 目标湿度${parameterConfig.airHumidity.target.toFixed(1)}%（当前${sensorData.airHumidity.toFixed(1)}%）`;
        }
        return "系统待机中 - 当前湿度适宜";
        
      case 'lighting':
        if (sensorData.lightIntensity < parameterConfig.lightIntensity.target) {
          return `正在补光 - 目标光照${parameterConfig.lightIntensity.target.toFixed(1)}lux（当前${sensorData.lightIntensity.toFixed(1)}lux）`;
        }
        return "系统待机中 - 自然光照充足";
        
      case 'irrigation':
        if (sensorData.soilMoisture < parameterConfig.soilMoisture.target) {
          return `正在灌溉 - 目标土壤湿度${parameterConfig.soilMoisture.target.toFixed(1)}%（当前${sensorData.soilMoisture.toFixed(1)}%）`;
        }
        return "系统待机中 - 土壤水分充足";
        
      case 'co2':
        if (sensorData.co2Level < parameterConfig.co2Level.target) {
          return `正在补充CO2 - 目标浓度${parameterConfig.co2Level.target.toFixed(1)}ppm（当前${sensorData.co2Level.toFixed(1)}ppm）`;
        }
        return "系统待机中 - CO2浓度适宜";
        
      case 'shading':
        if (sensorData.lightIntensity > parameterConfig.lightIntensity.target * 1.2) {
          return `正在遮阳 - 降低光照强度至${parameterConfig.lightIntensity.target.toFixed(1)}lux（当前${sensorData.lightIntensity.toFixed(1)}lux）`;
        }
        return "系统待机中 - 光照强度适宜";
        
      default:
        return "系统待机中";
    }
  };

  const renderControlSystem = (system: ControlSystem) => {
    const systemState = systems[system.name];
    
    return (
      <Col xs={24} md={12} key={system.name} style={{ marginBottom: 16 }}>
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
            <Text style={{ 
              color: 'rgba(0, 0, 0, 0.65)', 
              fontSize: '14px', 
              marginBottom: '16px'
            }}>
              {system.description}
            </Text>
            
            <div style={{ marginBottom: '16px' }}>
              <Text>影响效果：</Text>
              <ul style={{ 
                margin: '8px 0 16px 20px', 
                padding: 0,
                minHeight: '80px'  // 确保效果列表区域高度一致
              }}>
                {system.effects.map((effect, index) => (
                  <li key={index}>{effect}</li>
                ))}
              </ul>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ 
                marginBottom: '16px', 
                display: 'flex', 
                alignItems: 'center',
                height: '32px'  // 固定控制模式区域高度
              }}>
                <Text>控制模式：</Text>
                <Switch
                  checked={masterAutoControl || systemState?.isAuto}
                  onChange={(checked) => handleSystemAutoChange(system.name, checked)}
                  disabled={masterAutoControl}
                  style={{ marginLeft: 8 }}
                />
                <Text style={{ marginLeft: 8 }}>
                  {(masterAutoControl || systemState?.isAuto) ? '自动' : '手动'}
                </Text>
              </div>

              <div style={{ 
                marginBottom: '16px', 
                display: 'flex', 
                alignItems: 'center',
                height: '32px'  // 固定滑块区域高度
              }}>
                <Text>运行功率：</Text>
                <div style={{ flex: 1, margin: '0 12px' }}>
                  <Slider
                    value={systemState?.currentPower}
                    onChange={(value) => handlePowerChange(system.name, value)}
                    disabled={masterAutoControl || systemState?.isAuto}
                    min={system.min}
                    max={system.max}
                    step={system.step}
                  />
                </div>
                <Text style={{ minWidth: '48px' }}>
                  {systemState?.currentPower}%
                </Text>
              </div>
            </div>

            <Text style={{ 
              color: '#1890ff', 
              fontSize: '14px', 
              marginTop: 'auto',
              fontStyle: 'italic',
              height: '32px',  // 固定状态文本区域高度
              display: 'flex',
              alignItems: 'center'
            }}>
              {getCurrentStatus(system)}
            </Text>
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        {error ? (
          <Alert message="数据加载错误" type="error" showIcon />
        ) : (
          <>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <Switch
                    checked={masterAutoControl}
                    onChange={handleMasterAutoControl}
                    style={{ marginRight: 8 }}
                  />
                  <Text strong>智能全自动控制</Text>
                </div>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin />
                  </div>
                ) : null}
              </Space>
            </Card>
            
            <Alert
              message="智能控制系统说明"
              description={
                <div>
                  <Paragraph>
                    系统支持两种控制模式：
                    <ul>
                      <li><Text strong>自动模式：</Text>系统根据环境参数自动调节各个子系统的运行状态，实现最优环境控制。</li>
                      <li><Text strong>手动模式：</Text>可以手动调节各个子系统的运行参数，适用于特殊情况下的人工干预。</li>
                    </ul>
                  </Paragraph>
                  <Paragraph>
                    <Text type="warning"><strong>注意：当任何子系统切换到手动模式时，智能控制将自动关闭。重新开启智能控制后，所有子系统将恢复到自动模式。</strong></Text>
                  </Paragraph>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Row gutter={[16, 16]}>
              {controlSystems.map(system => renderControlSystem(system))}
            </Row>
          </>
        )}
      </Space>
    </div>
  );
};

export default EnvironmentControl; 