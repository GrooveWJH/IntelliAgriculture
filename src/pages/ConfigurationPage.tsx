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
  Slider
} from 'antd';
import { SensorWaveConfig, WaveParams, getConfigCopy } from '../utils/sensorDataGenerator';
import { useSensorData } from '../contexts/SensorDataContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

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
  const { currentWaveConfig, setWaveConfig, setSimulationTimeOffset } = useSensorData();
  const [config, setConfig] = useState<SensorWaveConfig>(getConfigCopy());
  const [timeOffset, setTimeOffset] = useState(0);
  
  useEffect(() => {
    setConfig(currentWaveConfig);
  }, [currentWaveConfig]);
  
  const handleParameterChange = (parameter: keyof SensorWaveConfig, params: WaveParams) => {
    setConfig(prev => ({
      ...prev,
      [parameter]: params
    }));
  };
  
  const handleApplyConfig = () => {
    setWaveConfig(config);
    message.success('配置已应用');
  };
  
  const handleResetConfig = () => {
    setConfig(getConfigCopy());
    message.info('配置已重置');
  };
  
  const handleApplyTimeOffset = () => {
    setSimulationTimeOffset(timeOffset * 60 * 60 * 1000); // 转换小时为毫秒
    message.success(`时间偏移已设置为 ${timeOffset} 小时`);
  };
  
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>传感器数据模拟配置</Title>
      <Text>
        调整参数以控制模拟传感器数据的波动特性。波动基于正弦函数，可以设置基础值、振幅、周期、相位和噪声级别。
      </Text>
      
      <Divider />
      
      <Row gutter={16}>
        <Col span={24}>
          <Card title="时间控制" style={{ marginBottom: 16 }}>
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
            </Form>
          </Card>
        </Col>
      </Row>
      
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
      
      <Divider />
      
      <Row justify="end" gutter={16}>
        <Col>
          <Button onClick={handleResetConfig}>
            重置为默认值
          </Button>
        </Col>
        <Col>
          <Button type="primary" onClick={handleApplyConfig}>
            应用配置
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default ConfigurationPage; 