import React, { useState, useEffect } from 'react';
import { Button, Drawer, Form, InputNumber, Select, Space, Typography, List, Tag, Badge, Divider, Empty } from 'antd';
import { PlusOutlined, CloseOutlined, ExperimentOutlined, ThunderboltOutlined, CloudOutlined, WarningOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { weatherService, WeatherInterference } from '../services/WeatherDataService';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;

const FloatingButton = styled(Button)`
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 48px;
  height: 48px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const InterferenceIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.color || '#1890ff'};
  color: white;
  font-size: 16px;
  margin-right: 12px;
`;

const InterferenceListItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  margin-bottom: 12px;
  position: relative;
`;

const InterferenceInfo = styled.div`
  flex: 1;
  margin-left: 12px;
`;

const TimeRemaining = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
`;

interface InterferenceFormData {
  type: WeatherInterference['type'];
  value: number;
  duration: number;
}

interface InterferenceOption {
  label: string;
  value: WeatherInterference['type'];
  unit: string;
  min: number;
  max: number;
  icon: React.ReactNode;
  color: string;
}

const interferenceOptions: InterferenceOption[] = [
  {
    label: '温度干扰',
    value: 'temperature',
    unit: '°C',
    min: -10,
    max: 10,
    icon: <ThunderboltOutlined />,
    color: '#ff4d4f'
  },
  {
    label: '湿度干扰',
    value: 'humidity',
    unit: '%',
    min: -20,
    max: 20,
    icon: <CloudOutlined />,
    color: '#1890ff'
  },
  {
    label: 'CO2浓度干扰',
    value: 'co2',
    unit: 'ppm',
    min: -200,
    max: 200,
    icon: <ExperimentOutlined />,
    color: '#722ed1'
  },
  {
    label: '光照干扰',
    value: 'light',
    unit: 'lux',
    min: -1000,
    max: 1000,
    icon: <WarningOutlined />,
    color: '#faad14'
  },
];

interface Props {
  onAddInterference?: (data: InterferenceFormData) => void;
}

const InterferencePanel: React.FC<Props> = ({ onAddInterference }) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState<WeatherInterference['type']>(interferenceOptions[0].value);
  const [activeInterferences, setActiveInterferences] = useState<WeatherInterference[]>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // 获取当前活跃干扰
  useEffect(() => {
    const updateActiveInterferences = () => {
      const interferences = weatherService.getActiveInterferences();
      setActiveInterferences(interferences);
    };
    
    updateActiveInterferences();
    
    // 每秒更新一次活跃干扰列表，以更新剩余时间
    const timer = setInterval(() => {
      updateActiveInterferences();
      setRefreshCounter(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [refreshCounter]);
  
  // 徽章计数
  const badgeCount = activeInterferences.length;
  
  // 添加干扰
  const handleSubmit = () => {
    form.validateFields().then((values: InterferenceFormData) => {
      // 添加干扰到天气服务
      weatherService.addInterference(values.type, values.value, values.duration);
      
      // 如果有回调函数，也调用它
      if (onAddInterference) {
      onAddInterference(values);
      }
      
      form.resetFields();
      
      // 刷新干扰列表
      setRefreshCounter(prev => prev + 1);
    });
  };

  // 清除所有干扰
  const clearAllInterferences = () => {
    weatherService.clearAllInterferences();
    setRefreshCounter(prev => prev + 1);
  };
  
  // 获取当前选中的干扰选项配置
  const getCurrentOption = () => {
    return interferenceOptions.find(option => option.value === selectedType) || interferenceOptions[0];
  };
  
  // 获取干扰类型信息
  const getInterferenceTypeInfo = (type: WeatherInterference['type']) => {
    return interferenceOptions.find(option => option.value === type) || interferenceOptions[0];
  };
  
  // 计算干扰剩余时间
  const getTimeRemaining = (endTime: number) => {
    const now = Date.now();
    const remainingMs = Math.max(0, endTime - now);
    const remainingMinutes = Math.floor(remainingMs / (60 * 1000));
    const remainingSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
    
    return `${remainingMinutes}分${remainingSeconds}秒`;
  };

  return (
    <>
      <FloatingButton
        type="primary"
        onClick={() => setOpen(true)}
      >
        <Badge count={badgeCount} overflowCount={99}>
          <PlusOutlined style={{ fontSize: '20px' }} />
        </Badge>
      </FloatingButton>
      
      <Drawer
        title="环境干扰模拟"
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        width={400}
        extra={
          <Button 
            type="primary" 
            danger 
            disabled={activeInterferences.length === 0}
            onClick={clearAllInterferences}
          >
            清除所有干扰
          </Button>
        }
      >
        <Title level={5}>添加新干扰</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: interferenceOptions[0].value,
            value: 0,
            duration: 5,
          }}
        >
          <Form.Item
            name="type"
            label="干扰类型"
            rules={[{ required: true }]}
          >
            <Select onChange={(value) => setSelectedType(value as WeatherInterference['type'])}>
              {interferenceOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="value"
            label={`干扰值 (${getCurrentOption().unit})`}
            rules={[{ required: true }]}
          >
            <InputNumber
              min={getCurrentOption().min}
              max={getCurrentOption().max}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="duration"
            label="持续时间（分钟）"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={60} style={{ width: '100%' }} />
          </Form.Item>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" onClick={handleSubmit} block>
              添加干扰
            </Button>
            <Text type="secondary">
              添加干扰后，系统将自动调节相关设备参数以维持环境稳定。
              您可以在实时监控中观察系统的响应情况。
            </Text>
          </Space>
        </Form>
        
        <Divider />
        
        <Title level={5}>当前活跃干扰 ({activeInterferences.length})</Title>
        
        {activeInterferences.length > 0 ? (
          <List
            dataSource={activeInterferences}
            renderItem={(interference) => {
              const typeInfo = getInterferenceTypeInfo(interference.type);
              return (
                <InterferenceListItem>
                  <InterferenceIcon color={typeInfo.color}>
                    {typeInfo.icon}
                  </InterferenceIcon>
                  <InterferenceInfo>
                    <div>
                      <Text strong>{typeInfo.label}</Text>
                      <Tag color={typeInfo.color} style={{ marginLeft: 8 }}>
                        {interference.value > 0 ? '+' : ''}{interference.value}{typeInfo.unit}
                      </Tag>
                    </div>
                    <TimeRemaining>
                      剩余时间: {getTimeRemaining(interference.endTime)}
                    </TimeRemaining>
                  </InterferenceInfo>
                </InterferenceListItem>
              );
            }}
          />
        ) : (
          <Empty description="当前没有活跃的干扰" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Drawer>
    </>
  );
};

export default InterferencePanel; 