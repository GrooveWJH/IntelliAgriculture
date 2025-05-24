import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Card, 
  InputNumber, 
  Button, 
  Row, 
  Col, 
  Divider, 
  Typography, 
  message, 
  Tabs,
  Slider,
  Alert,
  Radio,
  Space,
  Tooltip,
  Switch,
  Modal
} from 'antd';
import { 
  InfoCircleOutlined, 
  QuestionCircleOutlined, 
  SettingOutlined,
  ExperimentOutlined,
  CloudOutlined
} from '@ant-design/icons';
import { SensorWaveConfig, WaveParams, getConfigCopy } from '../utils/sensorDataGenerator';
import { useSensorData } from '../contexts/SensorDataContext';
import styled from 'styled-components';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const PageHeader = styled.div`
  margin-bottom: 24px;
`;

const StyledAlert = styled(Alert)`
  margin-bottom: 16px;
`;

const SimulationModeCard = styled(Card)`
  margin-bottom: 24px;
  background-color: #f8f9fa;
`;

const ControlPanel = styled.div`
  position: sticky;
  bottom: 0;
  background: white;
  padding: 16px 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 24px;
`;

const SummaryBox = styled.div`
  background-color: #f0f7ff;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #1890ff;
`;

interface ParamFormItemProps {
  label: string;
  field: keyof WaveParams;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number | null) => void;
  tooltip?: string;
}

const ParamFormItem: React.FC<ParamFormItemProps> = ({ 
  label, field, min, max, step, value, onChange, tooltip 
}) => {
  const handleChange = (val: number | null) => {
    onChange(val === null ? min : val);
  };

  return (
    <Form.Item label={label} tooltip={tooltip}>
      <Row>
        <Col span={16}>
          <Slider
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            styles={{
              track: { transition: 'none' },
              rail: { transition: 'none' },
              handle: { transition: 'none' }
            }}
          />
        </Col>
        <Col span={7} offset={1}>
          <InputNumber
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>
    </Form.Item>
  );
};

const ParameterConfigCard: React.FC<{
  title: string;
  params: WaveParams;
  onChange: (params: WaveParams) => void;
}> = ({ title, params, onChange }) => {
  const handleChange = (field: keyof WaveParams, value: number | null) => {
    if (value === null) return;
    
    onChange({
      ...params,
      [field]: value
    });
  };

  return (
    <Card title={title} bordered={false} style={{ marginBottom: 16 }}>
      <Form layout="vertical">
        <ParamFormItem
          label="基础值"
          field="baseValue"
          min={0}
          max={params.baseValue * 2}
          step={1}
          value={params.baseValue}
          onChange={(value) => handleChange('baseValue', value)}
          tooltip="参数的基础值，波动将以此为中心"
        />
        
        <ParamFormItem
          label="波动幅度"
          field="amplitude"
          min={0}
          max={params.baseValue}
          step={0.1}
          value={params.amplitude}
          onChange={(value) => handleChange('amplitude', value)}
          tooltip="波动的最大幅度"
        />
        
        <ParamFormItem
          label="周期（小时）"
          field="period"
          min={1}
          max={168} // 最大一周
          step={1}
          value={params.period / (60 * 60 * 1000)} // 转换为小时
          onChange={(value) => {
            if (value === null) return;
            handleChange('period', value * 60 * 60 * 1000);
          }} // 转换回毫秒
          tooltip="完成一次完整波动所需的时间"
        />
        
        <ParamFormItem
          label="相位（0-2π）"
          field="phase"
          min={0}
          max={Math.PI * 2}
          step={0.1}
          value={params.phase}
          onChange={(value) => handleChange('phase', value)}
          tooltip="波动的起始相位，用于控制不同参数之间的波动关系"
        />
        
        <ParamFormItem
          label="噪声级别"
          field="noiseLevel"
          min={0}
          max={1}
          step={0.01}
          value={params.noiseLevel}
          onChange={(value) => handleChange('noiseLevel', value)}
          tooltip="添加的随机噪声大小，使波动看起来更自然"
        />
      </Form>
    </Card>
  );
};

const ConfigurationPage: React.FC = () => {
  const { 
    currentWaveConfig, 
    setWaveConfig, 
    setSimulationTimeOffset, 
    isWeatherDriven, 
    setWeatherDriven 
  } = useSensorData();
  
  const [config, setConfig] = useState<SensorWaveConfig>(getConfigCopy());
  const [timeOffset, setTimeOffset] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  useEffect(() => {
    setConfig(currentWaveConfig);
  }, [currentWaveConfig]);
  
  const handleParameterChange = (parameter: keyof SensorWaveConfig, params: WaveParams) => {
    setConfig(prev => ({
      ...prev,
      [parameter]: params
    }));
    setHasChanges(true);
  };
  
  const handleApplyConfig = () => {
    if (isWeatherDriven) {
      Modal.confirm({
        title: '模拟模式冲突',
        content: '您当前处于天气数据驱动模式，应用波形配置将自动切换到传统模拟模式。是否继续？',
        onOk: () => {
          setWeatherDriven(false);
          setWaveConfig(config);
          setHasChanges(false);
          message.success('已切换至传统模拟模式并应用配置');
        }
      });
    } else {
      setWaveConfig(config);
      setHasChanges(false);
      message.success('配置已应用');
    }
  };
  
  const handleResetConfig = () => {
    setConfig(getConfigCopy());
    setHasChanges(true);
    message.info('配置已重置');
  };
  
  const handleApplyTimeOffset = () => {
    setSimulationTimeOffset(timeOffset * 60 * 60 * 1000); // 转换小时为毫秒
    message.success(`时间偏移已设置为 ${timeOffset} 小时`);
  };
  
  const handleToggleWeatherDriven = (checked: boolean) => {
    if (checked && hasChanges) {
      Modal.confirm({
        title: '未保存的配置更改',
        content: '您有未应用的波形配置更改，切换到天气驱动模式将丢失这些更改。是否继续？',
        onOk: () => {
          setWeatherDriven(checked);
          setHasChanges(false);
          message.success('已切换至天气数据驱动模式');
        }
      });
    } else {
      setWeatherDriven(checked);
      message.success(`已切换至${checked ? '天气数据驱动' : '传统波形模拟'}模式`);
    }
  };
  
  return (
    <div style={{ padding: 24 }}>
      <PageHeader>
        <Title level={2}>传感器数据模拟配置</Title>
        <Paragraph>
          在此页面可以配置系统如何生成模拟数据。系统支持两种模拟模式：
          <Tooltip title="点击右上角的帮助按钮获取更多信息">
            <Text strong> 天气数据驱动模式 </Text>
          </Tooltip>
          和
          <Tooltip title="点击右上角的帮助按钮获取更多信息">
            <Text strong> 传统波形模拟模式</Text>
          </Tooltip>
          。
        </Paragraph>
        <Button 
          type="link" 
          icon={<QuestionCircleOutlined />} 
          onClick={() => setShowHelpModal(true)}
          style={{ padding: 0 }}
        >
          了解更多关于模拟模式的信息
        </Button>
      </PageHeader>
      
      <StyledAlert
        message="模拟模式选择"
        description="请选择适合您需求的数据模拟模式。不同模式下，参数配置的影响会有所不同。"
        type="info"
        showIcon
      />
      
      <SimulationModeCard title="模拟模式配置" bordered={false}>
        <Row gutter={16} align="middle">
          <Col span={16}>
            <Radio.Group 
              value={isWeatherDriven ? "weather" : "wave"} 
              onChange={(e) => handleToggleWeatherDriven(e.target.value === "weather")}
              buttonStyle="solid"
            >
              <Radio.Button value="weather">
                <CloudOutlined /> 天气数据驱动模式
              </Radio.Button>
              <Radio.Button value="wave">
                <ExperimentOutlined /> 传统波形模拟模式
              </Radio.Button>
            </Radio.Group>
            
            <Paragraph style={{ marginTop: 16 }}>
              {isWeatherDriven ? (
                <SummaryBox>
                  <Text strong>当前模式：天气数据驱动</Text>
                  <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                    系统将基于模拟天气数据和大棚物理特性计算环境参数，提供更真实的模拟效果。
                    此模式下，波形配置不会生效，但您可以在环境控制页面调整控制系统的影响。
                  </Paragraph>
                </SummaryBox>
              ) : (
                <SummaryBox>
                  <Text strong>当前模式：传统波形模拟</Text>
                  <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                    系统将使用正弦波函数直接生成传感器数据，您可以通过下方配置调整各参数的波动特性。
                    此模式下，环境控制系统的效果将基于这些波形参数调整进行模拟。
                  </Paragraph>
                </SummaryBox>
              )}
            </Paragraph>
          </Col>
          <Col span={8}>
            <Divider type="vertical" style={{ height: '100%' }} />
            <Card
              size="small"
              title="当前模式影响"
              bordered={false}
              style={{ marginLeft: 16 }}
            >
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                <li>数据仪表盘显示</li>
                <li>历史数据分析</li>
                <li>控制系统反馈</li>
                <li>告警系统触发</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </SimulationModeCard>
      
      <Divider />
      
      <Row gutter={16}>
        <Col span={24}>
          <Card 
            title={
              <Space>
                <SettingOutlined />
                <span>时间控制</span>
                <Tooltip title="时间偏移允许您模拟不同时间的传感器数据，适用于测试日夜循环、季节变化等场景">
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                </Tooltip>
              </Space>
            } 
            style={{ marginBottom: 16 }}
          >
            <Form layout="inline">
              <Form.Item label="时间偏移（小时）" tooltip="设置时间偏移，用于测试不同时间的数据">
                <InputNumber 
                  value={timeOffset} 
                  onChange={value => setTimeOffset(value || 0)} 
                  min={-168} 
                  max={168} 
                  step={1}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={handleApplyTimeOffset}>
                  应用时间偏移
                </Button>
              </Form.Item>
              <Form.Item>
                <Text type="secondary">
                  （正值表示未来，负值表示过去，单位：小时）
                </Text>
              </Form.Item>
            </Form>
            <Text type="secondary">
              注意：时间偏移在两种模拟模式下均有效，但影响方式不同。
              在传统模式下影响波形计算，在天气驱动模式下影响天气数据的选择。
            </Text>
          </Card>
        </Col>
      </Row>
      
      <div style={{ opacity: isWeatherDriven ? 0.6 : 1, pointerEvents: isWeatherDriven ? 'none' : 'auto' }}>
        {isWeatherDriven && (
          <StyledAlert
            message="天气驱动模式已启用"
            description="在天气驱动模式下，以下波形配置不会生效。如需使用波形配置，请切换到传统波形模拟模式。"
            type="warning"
            showIcon
          />
        )}
        
        <Tabs defaultActiveKey="1">
          <TabPane tab="环境参数" key="1">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <ParameterConfigCard
                  title="空气温度"
                  params={config.airTemperature}
                  onChange={(params) => handleParameterChange('airTemperature', params)}
                />
              </Col>
              <Col xs={24} md={12}>
                <ParameterConfigCard
                  title="空气湿度"
                  params={config.airHumidity}
                  onChange={(params) => handleParameterChange('airHumidity', params)}
                />
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <ParameterConfigCard
                  title="土壤温度"
                  params={config.soilTemperature}
                  onChange={(params) => handleParameterChange('soilTemperature', params)}
                />
              </Col>
              <Col xs={24} md={12}>
                <ParameterConfigCard
                  title="土壤湿度"
                  params={config.soilMoisture}
                  onChange={(params) => handleParameterChange('soilMoisture', params)}
                />
              </Col>
            </Row>
          </TabPane>
          
          <TabPane tab="其他参数" key="2">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <ParameterConfigCard
                  title="CO2浓度"
                  params={config.co2Level}
                  onChange={(params) => handleParameterChange('co2Level', params)}
                />
              </Col>
              <Col xs={24} md={12}>
                <ParameterConfigCard
                  title="光照强度"
                  params={config.lightIntensity}
                  onChange={(params) => handleParameterChange('lightIntensity', params)}
                />
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <ParameterConfigCard
                  title="土壤PH值"
                  params={config.soilPH}
                  onChange={(params) => handleParameterChange('soilPH', params)}
                />
              </Col>
              <Col xs={24} md={12}>
                <ParameterConfigCard
                  title="电导率"
                  params={config.ec}
                  onChange={(params) => handleParameterChange('ec', params)}
                />
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </div>
      
      <ControlPanel>
        <Button onClick={handleResetConfig} disabled={isWeatherDriven}>
          重置为默认值
        </Button>
        <Button 
          type="primary" 
          onClick={handleApplyConfig} 
          disabled={isWeatherDriven && !hasChanges}
        >
          应用配置
        </Button>
      </ControlPanel>
      
      <Modal
        title="模拟模式说明"
        open={showHelpModal}
        onCancel={() => setShowHelpModal(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowHelpModal(false)}>
            我知道了
          </Button>
        ]}
        width={700}
      >
        <Title level={4}>两种模拟模式的区别</Title>
        
        <Card title="天气数据驱动模式" style={{ marginBottom: 16 }}>
          <Paragraph>
            <Text strong>工作原理：</Text> 基于模拟天气数据（温度、湿度、云量、降水等）和大棚物理特性（保温性、透光率等）来计算室内环境参数。
          </Paragraph>
          <Paragraph>
            <Text strong>优点：</Text> 更加真实，能够模拟真实天气变化对大棚环境的影响，环境参数之间有合理的关联性。
          </Paragraph>
          <Paragraph>
            <Text strong>适用场景：</Text> 测试环境控制系统对外部天气变化的响应能力，进行更接近实际情况的系统测试。
          </Paragraph>
          <Paragraph>
            <Text strong>配置项：</Text> 在大棚设置页面可以调整大棚物理属性；在环境干扰面板可添加临时干扰。
          </Paragraph>
        </Card>
        
        <Card title="传统波形模拟模式">
          <Paragraph>
            <Text strong>工作原理：</Text> 使用正弦波函数直接生成各个传感器参数的数值，每个参数独立配置。
          </Paragraph>
          <Paragraph>
            <Text strong>优点：</Text> 高度可定制，可以精确控制每个参数的变化规律，便于测试特定场景。
          </Paragraph>
          <Paragraph>
            <Text strong>适用场景：</Text> 测试系统对特定参数变化的响应，模拟极端情况，进行控制算法优化等。
          </Paragraph>
          <Paragraph>
            <Text strong>配置项：</Text> 本页面中的波形配置参数，可以独立调整每个参数的基值、波动幅度、周期等。
          </Paragraph>
        </Card>
        
        <Divider />
        
        <Title level={5}>数据影响范围</Title>
        <Paragraph>
          无论哪种模式下生成的数据，都会：
          <ul>
            <li>实时显示在仪表盘上</li>
            <li>存储到时间序列数据库中作为历史数据</li>
            <li>触发相应的控制系统响应</li>
            <li>如果超过阈值，会触发警报系统</li>
          </ul>
        </Paragraph>
        
        <Paragraph type="warning">
          注意：为了便于测试和演示，系统会按照配置生成模拟数据。在实际应用中，数据将来自真实的传感器采集。
        </Paragraph>
      </Modal>
    </div>
  );
};

export default ConfigurationPage; 