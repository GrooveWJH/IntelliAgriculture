import React, { useState } from 'react';
import { Button, Drawer, Form, InputNumber, Select, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Text } = Typography;
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

interface InterferenceFormData {
  type: string;
  value: number;
  duration: number;
}

interface InterferenceOption {
  label: string;
  value: string;
  unit: string;
  min: number;
  max: number;
}

const interferenceOptions: InterferenceOption[] = [
  {
    label: '温度干扰',
    value: 'temperature',
    unit: '°C',
    min: -10,
    max: 10,
  },
  {
    label: '湿度干扰',
    value: 'humidity',
    unit: '%',
    min: -20,
    max: 20,
  },
  {
    label: 'CO2浓度干扰',
    value: 'co2',
    unit: 'ppm',
    min: -200,
    max: 200,
  },
  {
    label: '光照干扰',
    value: 'light',
    unit: 'lux',
    min: -1000,
    max: 1000,
  },
];

interface Props {
  onAddInterference: (data: InterferenceFormData) => void;
}

const InterferencePanel: React.FC<Props> = ({ onAddInterference }) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState<string>(interferenceOptions[0].value);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onAddInterference(values);
      form.resetFields();
      setOpen(false);
    });
  };

  const getCurrentOption = () => {
    return interferenceOptions.find(option => option.value === selectedType);
  };

  return (
    <>
      <FloatingButton
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setOpen(true)}
      />
      <Drawer
        title="添加环境干扰"
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        width={400}
      >
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
            <Select onChange={(value) => setSelectedType(value)}>
              {interferenceOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="value"
            label={`干扰值 (${getCurrentOption()?.unit})`}
            rules={[{ required: true }]}
          >
            <InputNumber
              min={getCurrentOption()?.min}
              max={getCurrentOption()?.max}
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
      </Drawer>
    </>
  );
};

export default InterferencePanel; 