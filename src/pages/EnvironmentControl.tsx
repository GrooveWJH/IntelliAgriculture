import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Slider, Button, Typography, Tabs, Switch, Tooltip, Alert, Badge, Form, InputNumber } from 'antd';
import {
  RocketOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  CloudOutlined,
  SettingOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  PoweroffOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useSensorData } from '../contexts/SensorDataContext';
import { parameterConfig } from './Dashboard';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 样式组件
const ControlCard = styled(Card)<{ active: boolean }>`
  margin-bottom: 16px;
  border-radius: 8px;
  height: 100%;
  transition: all 1.5s ease-in-out;
  border: 1px solid ${props => props.active ? '#52c41a' : '#f0f0f0'};
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .ant-card-head {
    background-color: ${props => props.active ? 'rgba(82, 196, 26, 0.05)' : 'inherit'};
    border-bottom: 1px solid ${props => props.active ? '#e6f7e1' : '#f0f0f0'};
    padding: 16px 24px;
    transition: all 1.5s ease-in-out;
  }
  
  .ant-card-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
  }
`;

const ControlHeader = styled.div`
  display: flex;
  align-items: center;
`;

const SystemDescription = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
`;

const SystemIcon = styled.div<{ active: boolean }>`
  font-size: 24px;
  margin-right: 16px;
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${props => props.active ? '#52c41a' : '#f0f2f5'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 1.5s ease-in-out;
  color: ${props => props.active ? 'white' : 'inherit'};
`;

const StatusBadge = styled(Badge)`
  .ant-badge-status-dot {
    width: 8px;
    height: 8px;
  }
`;

const SliderContainer = styled.div`
  padding: 0 4px;
  margin-top: 20px;
  margin-bottom: 30px;
  position: relative;
  
  .ant-slider {
    margin: 8px 0;
  }
  
  .ant-slider-rail {
    height: 10px;
    background-color: #f0f0f0;
    border-radius: 5px;
  }
  
  .ant-slider-track {
    transition: width 0.5s ease-in-out;
    height: 10px;
    background-color: #52c41a;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(82, 196, 26, 0.2);
  }
  
  .ant-slider-handle {
    transition: left 0.5s ease-in-out;
    width: 20px;
    height: 20px;
    margin-top: -5px;
    background-color: white;
    border: 2px solid #52c41a;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 50%;
  }
  
  .power-value-label {
    position: absolute;
    bottom: -25px;
    padding: 2px 8px;
    background-color: #52c41a;
    color: white;
    border-radius: 10px;
    font-size: 12px;
    font-weight: bold;
    transform: translateX(-50%);
    transition: left 0.5s ease-in-out, background-color 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 1;
    white-space: nowrap;
  }
`;

const ParameterInfo = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #f0f0f0;
`;

const StatusInfo = styled.div`
  margin-top: 16px;
  display: flex;
  align-items: center;
  font-size: 13px;
`;

const PowerIndicator = styled.div<{ power: number }>`
  display: flex;
  align-items: center;
  margin-top: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  transition: background-color 1.5s ease-in-out, color 1.5s ease-in-out, box-shadow 1.5s ease-in-out;
  background-color: ${props => {
    if (props.power === 0) return '#f5f5f5';
    if (props.power < 30) return 'rgba(82, 196, 26, 0.1)';
    if (props.power < 70) return 'rgba(250, 173, 20, 0.1)';
    return 'rgba(245, 34, 45, 0.1)';
  }};
  box-shadow: ${props => {
    if (props.power === 0) return 'none';
    if (props.power < 30) return '0 0 5px rgba(82, 196, 26, 0.2)';
    if (props.power < 70) return '0 0 5px rgba(250, 173, 20, 0.2)';
    return '0 0 5px rgba(245, 34, 45, 0.2)';
  }};
  
  .power-icon {
    margin-right: 12px;
    font-size: 16px;
    transition: color 1.5s ease-in-out;
    color: ${props => {
      if (props.power === 0) return '#bfbfbf';
      if (props.power < 30) return '#52c41a';
      if (props.power < 70) return '#faad14';
      return '#f5222d';
    }};
  }
  
  .power-text {
    flex: 1;
  }
  
  .power-value {
    font-weight: 500;
    font-size: 15px;
    transition: color 1.5s ease-in-out, transform 0.3s ease;
    color: ${props => {
      if (props.power === 0) return '#8c8c8c';
      if (props.power < 30) return '#52c41a';
      if (props.power < 70) return '#faad14';
      return '#f5222d';
    }};
  }
  
  .control-mode-link {
    margin-left: 16px;
    cursor: help;
    display: inline-flex;
    align-items: center;
    color: #1890ff;
    position: relative;
    
    &:hover .hint-text {
      opacity: 1;
      transform: translateY(0);
    }
    
    .hint-text {
      position: absolute;
      top: -20px;
      left: 0;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 0;
      transform: translateY(5px);
      transition: all 0.3s ease;
      pointer-events: none;
    }
  }
`;

const WeatherImpactAlert = styled(Alert)`
  margin-top: 20px;
`;

interface ControlSystem {
  name: string;
  type: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  controlMode: 'pid' | 'fuzzy' | 'smith';
  affectsParameters: string[];
}

const systems: ControlSystem[] = [
  {
    name: 'ventilation',
    type: 'ventilation',
    title: '通风系统',
    description: '控制空气流通，降低室内温度和湿度，平衡CO2浓度',
    icon: <RocketOutlined />,
    controlMode: 'smith',
    affectsParameters: ['airTemperature', 'airHumidity', 'co2Level']
  },
  {
    name: 'heating',
    type: 'heating',
    title: '加热系统',
    description: '提高室内温度，适用于低温环境',
    icon: <ThunderboltOutlined />,
    controlMode: 'pid',
    affectsParameters: ['airTemperature', 'airHumidity']
  },
  {
    name: 'cooling',
    type: 'cooling',
    title: '制冷系统',
    description: '降低室内温度，适用于高温环境',
    icon: <ThunderboltOutlined />,
    controlMode: 'pid',
    affectsParameters: ['airTemperature', 'airHumidity']
  },
  {
    name: 'humidification',
    type: 'humidification',
    title: '加湿系统',
    description: '增加空气湿度，适用于干燥环境',
    icon: <CloudOutlined />,
    controlMode: 'fuzzy',
    affectsParameters: ['airHumidity']
  },
  {
    name: 'dehumidification',
    type: 'dehumidification',
    title: '除湿系统',
    description: '降低空气湿度，适用于湿度过高环境',
    icon: <CloudOutlined />,
    controlMode: 'fuzzy',
    affectsParameters: ['airHumidity']
  },
  {
    name: 'lighting',
    type: 'lighting',
    title: '补光系统',
    description: '提供额外光照，促进植物生长',
    icon: <BulbOutlined />,
    controlMode: 'pid',
    affectsParameters: ['lightIntensity']
  },
  {
    name: 'irrigation',
    type: 'irrigation',
    title: '灌溉系统',
    description: '控制土壤湿度，提供植物生长所需水分',
    icon: <ExperimentOutlined />,
    controlMode: 'fuzzy',
    affectsParameters: ['soilMoisture', 'ec']
  },
  {
    name: 'co2Injection',
    type: 'co2Injection',
    title: 'CO2注入系统',
    description: '增加CO2浓度，促进光合作用',
    icon: <ExperimentOutlined />,
    controlMode: 'pid',
    affectsParameters: ['co2Level']
  }
];

// 系统状态类型
interface SystemState {
  name: string;
  currentPower: number;
  autoMode: boolean;
}

// 初始化系统状态
const initialSystemStates: Record<string, SystemState> = {};
systems.forEach(system => {
  initialSystemStates[system.name] = {
    name: system.name,
    currentPower: 0,  // 初始功率为0
    autoMode: true    // 默认为自动模式
  };
});

// 添加自定义的配置选项
interface ControlSettings {
  minimumUpdateInterval: number; // 单位为毫秒
}

const defaultControlSettings: ControlSettings = {
  minimumUpdateInterval: 2000 // 2秒
};

// 控制模式说明
const controlModeExplanations = {
  pid: {
    title: 'PID控制',
    description: '比例-积分-微分控制器，适用于线性系统，可以快速响应并修正误差。在加热、制冷、补光等系统中表现良好，能够精确维持目标值。',
    usage: '适用于需要精确控制和快速响应的系统，对持续性误差和突发扰动都有良好抵抗能力。',
    modifyGuide: '如需修改PID控制参数或更换控制方法，请编辑文件：src/controllers/pidController.ts'
  },
  fuzzy: {
    title: '模糊控制',
    description: '基于模糊逻辑的控制方法，适合处理复杂的非线性系统和不确定性高的环境。在湿度控制、灌溉等多因素影响的系统中表现更好。',
    usage: '适用于精确数学模型难以建立，但具有较丰富经验知识的场景，尤其适合多输入多输出系统。',
    modifyGuide: '如需修改模糊控制规则或更换控制方法，请编辑文件：src/controllers/fuzzyController.ts'
  },
  smith: {
    title: 'Smith预测器',
    description: 'Smith预测控制适合具有大延迟的系统，通过内部模型预测系统响应，克服传统PID在大延迟系统中的不足。在通风系统中使用，可有效处理空气流动的滞后效应。',
    usage: '适用于输入变化到输出响应有明显时间延迟的系统，如通风系统中室外空气进入到室内温湿度变化的过程。',
    modifyGuide: '如需修改Smith预测器参数或更换控制方法，请编辑文件：src/controllers/smithController.ts'
  }
};

const EnvironmentControl: React.FC = () => {
  const { sensorData, isWeatherDriven, setControlSystemEffect } = useSensorData();
  const [activeTab, setActiveTab] = useState<string>('1');
  const [systemStates, setSystemStates] = useState<Record<string, SystemState>>(initialSystemStates);
  const [controlSettings, setControlSettings] = useState<ControlSettings>(defaultControlSettings);
  const [lastUpdateTime, setLastUpdateTime] = useState<Record<string, number>>({});

  // 自动控制逻辑 - 根据传感器数据自动调整控制系统
  useEffect(() => {
    if (!sensorData) return;

    // 创建新的系统状态对象
    const newSystemStates = { ...systemStates };
    
    // 检查每个系统
    Object.keys(newSystemStates).forEach(systemName => {
      // 只在自动模式下调整
      if (!newSystemStates[systemName].autoMode) return;
      
      let newPower = 0;
      
      // 根据系统类型和当前环境参数计算功率
      switch (systemName) {
        case 'heating':
          // 如果温度低于目标值，启动加热
          if (sensorData.airTemperature < parameterConfig.airTemperature.target) {
            const diff = parameterConfig.airTemperature.target - sensorData.airTemperature;
            // 每度温差增加20%功率，最高100%
            newPower = Math.min(100, Math.round(diff * 20));
  }
          break;
          
        case 'cooling':
          // 如果温度高于目标值，启动制冷
          if (sensorData.airTemperature > parameterConfig.airTemperature.target) {
            const diff = sensorData.airTemperature - parameterConfig.airTemperature.target;
            // 每度温差增加25%功率，最高100%
            newPower = Math.min(100, Math.round(diff * 25));
          }
          break;
          
    case 'ventilation':
          // 如果CO2浓度过高或湿度过高，启动通风
          if (sensorData.co2Level > parameterConfig.co2Level.target || 
              sensorData.airHumidity > parameterConfig.airHumidity.target) {
            // 计算CO2和湿度差异导致的通风需求
            const co2Diff = Math.max(0, sensorData.co2Level - parameterConfig.co2Level.target) / 100;
            const humidityDiff = Math.max(0, sensorData.airHumidity - parameterConfig.airHumidity.target);
            // 取CO2和湿度两者较大的通风需求
            newPower = Math.min(100, Math.round(Math.max(co2Diff * 10, humidityDiff * 2)));
      }
          break;

    case 'humidification':
          // 如果湿度低于目标值，启动加湿
          if (sensorData.airHumidity < parameterConfig.airHumidity.target) {
            const diff = parameterConfig.airHumidity.target - sensorData.airHumidity;
            // 每1%湿度差增加5%功率，最高100%
            newPower = Math.min(100, Math.round(diff * 5));
          }
          break;
          
        case 'dehumidification':
          // 如果湿度高于目标值，启动除湿
          if (sensorData.airHumidity > parameterConfig.airHumidity.target) {
            const diff = sensorData.airHumidity - parameterConfig.airHumidity.target;
            // 每1%湿度差增加6%功率，最高100%
            newPower = Math.min(100, Math.round(diff * 6));
      }
          break;

    case 'lighting':
          // 白天且光照不足时才启动补光
          const hour = new Date().getHours();
          const isDay = hour >= 6 && hour <= 18;
          if (isDay && sensorData.lightIntensity < parameterConfig.lightIntensity.target) {
            const diff = parameterConfig.lightIntensity.target - sensorData.lightIntensity;
            // 根据光照差异计算功率
            newPower = Math.min(100, Math.round((diff / parameterConfig.lightIntensity.target) * 100));
      }
          break;

    case 'irrigation':
          // 如果土壤湿度低于目标值，启动灌溉
          if (sensorData.soilMoisture < parameterConfig.soilMoisture.target) {
            const diff = parameterConfig.soilMoisture.target - sensorData.soilMoisture;
            // 每1%湿度差增加4%功率，最高100%
            newPower = Math.min(100, Math.round(diff * 4));
      }
          break;

        case 'co2Injection':
          // 如果CO2浓度低于目标值，启动CO2注入
          if (sensorData.co2Level < parameterConfig.co2Level.target) {
            const diff = parameterConfig.co2Level.target - sensorData.co2Level;
            // 每100ppm差异增加20%功率，最高100%
            newPower = Math.min(100, Math.round(diff / 5));
      }
          break;
  }
      
      // 检查是否满足最小更新间隔要求
      const now = Date.now();
      const lastUpdate = lastUpdateTime[systemName] || 0;

      // 自动模式下，即使功率为0也更新控制效果，只要满足最小更新间隔
      if ((now - lastUpdate >= controlSettings.minimumUpdateInterval) &&
          (newPower !== newSystemStates[systemName].currentPower)) {
        newSystemStates[systemName].currentPower = newPower;
        // 应用控制效果
        setControlSystemEffect(systemName, newPower);
        
        // 更新最后更新时间
        setLastUpdateTime(prev => ({
          ...prev,
          [systemName]: now
        }));
      }
    });
    
    // 更新系统状态
    setSystemStates(newSystemStates);
  }, [sensorData, controlSettings.minimumUpdateInterval]);

  // 更新控制系统功率
  const handlePowerChange = (system: string, value: number) => {
    const now = Date.now();
    const lastUpdate = lastUpdateTime[system] || 0;
    const isManualMode = !systemStates[system].autoMode;
    
    // 手动模式下不受最小更新时间间隔的限制
    // 自动模式下才检查是否满足最小更新间隔要求
    if (!isManualMode && now - lastUpdate < controlSettings.minimumUpdateInterval) {
      return; // 如果在自动模式下且更新太频繁，则忽略此次更新
    }
    
    // 更新系统状态
    setSystemStates(prev => ({
      ...prev,
      [system]: {
        ...prev[system],
        currentPower: value
      }
    }));
    
    // 将控制效果传递给环境模拟系统
    setControlSystemEffect(system, value);
    
    // 更新最后更新时间
    setLastUpdateTime(prev => ({
      ...prev,
      [system]: now
    }));
  };

  // 切换自动/手动模式
  const toggleAutoMode = (system: string) => {
    const currentSystem = systems.find(s => s.name === system);
    const currentState = systemStates[system];
    const newAutoMode = !currentState.autoMode;
    
    // 更新系统状态
    setSystemStates(prev => ({
      ...prev,
      [system]: {
        ...prev[system],
        autoMode: newAutoMode
      }
    }));
    
    // 如果切换到自动模式，立即计算并应用控制效果
    if (newAutoMode && sensorData && currentSystem) {
      let newPower = 0;
      
      // 立即计算新的功率值
      switch (system) {
        case 'heating':
          if (sensorData.airTemperature < parameterConfig.airTemperature.target) {
            const diff = parameterConfig.airTemperature.target - sensorData.airTemperature;
            newPower = Math.min(100, Math.round(diff * 20));
          }
          break;
          
        case 'cooling':
          if (sensorData.airTemperature > parameterConfig.airTemperature.target) {
            const diff = sensorData.airTemperature - parameterConfig.airTemperature.target;
            newPower = Math.min(100, Math.round(diff * 25));
          }
          break;
          
        case 'ventilation':
          if (sensorData.co2Level > parameterConfig.co2Level.target || 
              sensorData.airHumidity > parameterConfig.airHumidity.target) {
            const co2Diff = Math.max(0, sensorData.co2Level - parameterConfig.co2Level.target) / 100;
            const humidityDiff = Math.max(0, sensorData.airHumidity - parameterConfig.airHumidity.target);
            newPower = Math.min(100, Math.round(Math.max(co2Diff * 10, humidityDiff * 2)));
          }
          break;
          
        case 'humidification':
          if (sensorData.airHumidity < parameterConfig.airHumidity.target) {
            const diff = parameterConfig.airHumidity.target - sensorData.airHumidity;
            newPower = Math.min(100, Math.round(diff * 5));
          }
          break;
          
        case 'dehumidification':
          if (sensorData.airHumidity > parameterConfig.airHumidity.target) {
            const diff = sensorData.airHumidity - parameterConfig.airHumidity.target;
            newPower = Math.min(100, Math.round(diff * 6));
          }
          break;
          
        case 'lighting':
          const hour = new Date().getHours();
          const isDay = hour >= 6 && hour <= 18;
          if (isDay && sensorData.lightIntensity < parameterConfig.lightIntensity.target) {
            const diff = parameterConfig.lightIntensity.target - sensorData.lightIntensity;
            newPower = Math.min(100, Math.round((diff / parameterConfig.lightIntensity.target) * 100));
          }
          break;
          
        case 'irrigation':
          if (sensorData.soilMoisture < parameterConfig.soilMoisture.target) {
            const diff = parameterConfig.soilMoisture.target - sensorData.soilMoisture;
            newPower = Math.min(100, Math.round(diff * 4));
          }
          break;
          
        case 'co2Injection':
          if (sensorData.co2Level < parameterConfig.co2Level.target) {
            const diff = parameterConfig.co2Level.target - sensorData.co2Level;
            newPower = Math.min(100, Math.round(diff / 5));
          }
          break;
      }
      
      // 立即更新UI状态和环境控制效果
      setSystemStates(prev => ({
        ...prev,
        [system]: {
          ...prev[system],
          currentPower: newPower
        }
      }));
      
      // 应用控制效果到环境模拟系统
      setControlSystemEffect(system, newPower);
      
      // 更新最后更新时间
      setLastUpdateTime(prev => ({
        ...prev,
        [system]: Date.now()
      }));
    }
  };

  // 渲染控制系统卡片
  const renderControlSystem = (system: ControlSystem) => {
    const systemState = systemStates[system.name];
    const isActive = systemState.currentPower > 0;
    
    return (
      <Col xs={24} md={12} xl={8} key={system.name} style={{ marginBottom: 16 }}>
        <ControlCard
          active={isActive}
          title={
            <ControlHeader>
              <SystemIcon active={isActive}>{system.icon}</SystemIcon>
              <div>
                <Title level={4} style={{ margin: 0 }}>{system.title}</Title>
                <StatusBadge 
                  status={isActive ? "processing" : "default"} 
                  text={
                    <Text type={isActive ? "success" : "secondary"}>
                      {isActive ? "运行中" : "待机中"}
                    </Text>
                  } 
                />
              </div>
            </ControlHeader>
          }
          extra={
            <Switch
              checkedChildren="自动"
              unCheckedChildren="手动"
              checked={systemState.autoMode}
              onChange={() => toggleAutoMode(system.name)}
            />
          }
        >
          <SystemDescription>
            <Paragraph>{system.description}</Paragraph>
          </SystemDescription>
          
          {system.affectsParameters.length > 0 && (
            <ParameterInfo>
              <Text type="secondary">影响参数：</Text>
              {system.affectsParameters.map((param, index) => (
                <span key={param}>
                  {index > 0 && <span>, </span>}
                  <Text>{parameterConfig[param].name}</Text>
                </span>
              ))}
            </ParameterInfo>
          )}
          
          <SliderContainer>
            <Slider
              min={0}
              max={100}
              step={1}
              value={systemState.currentPower}
              onChange={(value) => handlePowerChange(system.name, value)}
              disabled={systemState.autoMode} // 在自动模式下禁用滑块
              tipFormatter={value => `${value}%`}
            />
            {systemState.currentPower > 0 && (
              <div 
                className="power-value-label" 
                style={{ 
                  left: `${systemState.currentPower}%`,
                  backgroundColor: systemState.currentPower < 30 ? '#52c41a' : 
                                  systemState.currentPower < 70 ? '#faad14' : '#f5222d'
                }}
              >
                {systemState.currentPower}%
              </div>
            )}
          </SliderContainer>
          
          <PowerIndicator power={systemState.currentPower}>
            <PoweroffOutlined className="power-icon" spin={systemState.currentPower > 0} />
            <span className="power-text">功率:</span>
            <span className="power-value">{systemState.currentPower}%</span>
            <Tooltip 
              title={getControlModeExplanation(system.controlMode)} 
              placement="rightTop" 
              overlayStyle={{ 
                maxWidth: '480px',
                minWidth: '450px'
              }}
              overlayInnerStyle={{
                padding: 0
              }}
              color="transparent"
              mouseEnterDelay={0.2}
              arrowPointAtCenter={true}
            >
              <span className="control-mode-link">
                控制模式: {getControlModeText(system.controlMode)} 
                <QuestionCircleOutlined style={{ marginLeft: 5, fontSize: '14px' }} />
                <span className="hint-text">点击查看详情</span>
              </span>
            </Tooltip>
          </PowerIndicator>
          
          <StatusInfo>
            <Text type="secondary">
              {getCurrentStatus(system)}
            </Text>
          </StatusInfo>
          
          {isWeatherDriven && systemState.currentPower > 0 && (
            <WeatherImpactAlert
              message="天气影响"
              description={getWeatherImpactText(system)}
              type="info"
              showIcon
            />
          )}
        </ControlCard>
      </Col>
    );
  };

  // 获取控制模式文本
  const getControlModeText = (mode: string) => {
    switch (mode) {
      case 'pid':
        return 'PID控制';
      case 'fuzzy':
        return '模糊控制';
      case 'smith':
        return 'Smith预测';
      default:
        return mode;
    }
  };

  // 获取控制模式解释
  const getControlModeExplanation = (mode: string) => {
    if (mode in controlModeExplanations) {
      const explanation = controlModeExplanations[mode as keyof typeof controlModeExplanations];
      return (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#2a2a2a', 
          color: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            borderBottom: '1px solid #555', 
            paddingBottom: '12px', 
            marginBottom: '12px', 
            color: '#1890ff' 
          }}>
            {explanation.title}
          </div>
          
          <div style={{ 
            marginBottom: '16px', 
            lineHeight: '1.8',
            fontSize: '15px',
            color: 'rgba(255, 255, 255, 0.95)'
          }}>
            {explanation.description}
          </div>
          
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '12px 16px', 
            borderRadius: '6px', 
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#faad14', fontSize: '15px' }}>
              使用场景：
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.7' }}>
              {explanation.usage}
            </div>
          </div>
          
          <div style={{ 
            background: 'rgba(24, 144, 255, 0.15)', 
            padding: '12px 16px', 
            borderRadius: '6px',
            borderLeft: '4px solid #1890ff'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1890ff', fontSize: '15px' }}>
              修改指引：
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.7' }}>
              {explanation.modifyGuide}
            </div>
          </div>
        </div>
      );
    }
    return '未知控制模式';
  };

  // 获取当前系统状态文本
  const getCurrentStatus = (system: ControlSystem) => {
    const systemState = systemStates[system.name];
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
        
      case 'heating':
        return `正在加热 - 目标温度${parameterConfig.airTemperature.target.toFixed(1)}°C（当前${sensorData.airTemperature.toFixed(1)}°C）`;
        
      case 'cooling':
        return `正在制冷 - 目标温度${parameterConfig.airTemperature.target.toFixed(1)}°C（当前${sensorData.airTemperature.toFixed(1)}°C）`;
        
      case 'humidification':
        if (sensorData.airHumidity < parameterConfig.airHumidity.target) {
          return `正在加湿 - 目标湿度${parameterConfig.airHumidity.target.toFixed(1)}%（当前${sensorData.airHumidity.toFixed(1)}%）`;
        }
        return "系统待机中 - 当前湿度适宜";
        
      case 'dehumidification':
        return `正在除湿 - 目标湿度${parameterConfig.airHumidity.target.toFixed(1)}%（当前${sensorData.airHumidity.toFixed(1)}%）`;
        
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
        
      case 'co2Injection':
        return `正在注入CO2 - 目标CO2浓度${parameterConfig.co2Level.target.toFixed(1)}ppm（当前${sensorData.co2Level.toFixed(1)}ppm）`;
        
      default:
        return `系统正在运行 - 功率${systemState.currentPower}%`;
    }
  };

  // 获取天气影响文本
  const getWeatherImpactText = (system: ControlSystem) => {
    if (!sensorData || !sensorData.weather) {
      return "无天气数据";
    }
    
    switch (system.type) {
      case 'ventilation':
        if (sensorData.weather === '大雨' || sensorData.weather === '中雨') {
          return "当前降雨较强，通风效率降低，湿度控制难度增加。";
        } else if (sensorData.outdoorTemperature && sensorData.outdoorTemperature > sensorData.airTemperature) {
          return `室外温度高于室内${(sensorData.outdoorTemperature - sensorData.airTemperature).toFixed(1)}°C，通风将导致室内温度上升。`;
        } else if (sensorData.outdoorTemperature) {
          return `室外温度低于室内${(sensorData.airTemperature - sensorData.outdoorTemperature).toFixed(1)}°C，通风有助于降温。`;
        }
        return "正常通风中，保持空气流通。";
        
      case 'heating':
        if (sensorData.weather === '晴天') {
          return "晴天阳光充足，加热需求降低。";
        } else if (sensorData.weather === '阴天' || sensorData.weather === '多云') {
          return "光照不足，加热系统需提供额外热量。";
        } else if (sensorData.weather.includes('雨')) {
          return "雨天环境温度较低，加热需求增加。";
        }
        return "正常加热中，维持室内温度。";
        
      case 'cooling':
        if (sensorData.weather === '晴天') {
          return "晴天阳光强烈，制冷需求增加。";
        } else if (sensorData.weather === '阴天' || sensorData.weather === '多云') {
          return "光照不强，制冷需求降低。";
        } else if (sensorData.weather.includes('雨')) {
          return "雨天环境温度较低，制冷需求降低。";
        }
        return "正常制冷中，维持室内温度。";
        
      case 'lighting':
        if (sensorData.weather === '晴天') {
          return "晴天光照充足，补光需求较低。";
        } else if (sensorData.weather === '多云') {
          return "多云天气，光照间歇性不足，补光系统辅助提供光照。";
        } else if (sensorData.weather === '阴天' || sensorData.weather.includes('雨')) {
          return "光照不足，补光系统全力运行以提供植物所需光照。";
        }
        return "正常补光中，确保植物光合作用。";
        
      default:
        return `当前天气：${sensorData.weather}，系统正常运行。`;
    }
  };

  // 在渲染控制系统组件末尾添加控制设置选项
  const renderControlSettings = () => {
    return (
      <Card title="控制设置" style={{ marginBottom: 16 }}>
        <Form layout="horizontal">
          <Form.Item 
            label="最小更新间隔" 
            tooltip="设备控制命令的最小发送间隔，较高的值可减少系统负担"
          >
            <InputNumber 
              min={500} 
              max={10000} 
              step={100} 
              value={controlSettings.minimumUpdateInterval}
              onChange={(value) => {
                if (value) {
                  setControlSettings(prev => ({
                    ...prev,
                    minimumUpdateInterval: value
                  }));
                }
              }}
              addonAfter="毫秒"
              style={{ width: '180px' }}
            />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              （建议：2000毫秒以上）
            </Text>
          </Form.Item>
        </Form>
        </Card>
    );
  };

  return (
    <div>
      <Title level={2}>环境控制系统</Title>
            
            <Alert
        message="控制系统优化"
        description="系统已优化：在自动模式下，控制器会根据环境参数和目标值之间的差异自动调整设备功率，不再通过开关状态控制。系统会实时计算所需功率并将控制指令传递给设备执行。"
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
        closable
      />
      
      {isWeatherDriven && (
        <Alert
          message="天气数据驱动模式已启用"
          description="系统当前使用天气数据驱动环境模拟。控制系统对环境的影响将考虑外部天气因素。"
              type="info"
              showIcon
          style={{ marginBottom: 16 }}
            />
      )}
      
      {renderControlSettings()}
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="全部系统" key="1">
          <Row gutter={16}>
            {systems.map(system => renderControlSystem(system))}
          </Row>
        </TabPane>
        <TabPane tab="温度控制" key="2">
          <Row gutter={16}>
            {systems
              .filter(system => ['ventilation', 'heating', 'cooling'].includes(system.name))
              .map(system => renderControlSystem(system))}
          </Row>
        </TabPane>
        <TabPane tab="湿度控制" key="3">
          <Row gutter={16}>
            {systems
              .filter(system => ['humidification', 'dehumidification', 'irrigation'].includes(system.name))
              .map(system => renderControlSystem(system))}
          </Row>
        </TabPane>
        <TabPane tab="光照与空气" key="4">
          <Row gutter={16}>
            {systems
              .filter(system => ['lighting', 'co2Injection'].includes(system.name))
              .map(system => renderControlSystem(system))}
            </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default EnvironmentControl; 