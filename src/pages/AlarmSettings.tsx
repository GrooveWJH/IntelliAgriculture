import React from 'react';
import { Card, Form, InputNumber, Switch, Select, Button, Typography, Space, message } from 'antd';
import styled from 'styled-components';
import { useSensorData } from '../contexts/SensorDataContext';

const { Title } = Typography;
const { Option } = Select;

const StyledCard = styled(Card)`
  margin: 20px;
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    height: auto !important;
    min-height: 32px;
    padding: 4px 4px !important;
  }
  .ant-select-selection-overflow {
    padding: 4px 0;
    min-height: 24px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .ant-select-selection-item {
    margin-top: 2px;
    margin-bottom: 2px;
  }
`;

const AlarmSettings: React.FC = () => {
  const [form] = Form.useForm();

  const handleSave = async (values: any) => {
    console.log('保存报警设置:', values);
    // TODO: 实现保存逻辑
    message.success('报警设置已保存');
  };

  return (
    <div>
      <StyledCard>
        <Title level={4}>报警阈值设置</Title>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            enabled: true,
            notificationMethod: ['sound', 'message'],
            thresholds: {
              temperature: {
                enabled: true,
                min: 15,
                max: 30,
                delay: 30
              },
              humidity: {
                enabled: true,
                min: 40,
                max: 80,
                delay: 30
              },
              co2: {
                enabled: true,
                min: 350,
                max: 1000,
                delay: 30
              },
              light: {
                enabled: true,
                min: 1000,
                max: 100000,
                delay: 30
              },
              soilMoisture: {
                enabled: true,
                min: 20,
                max: 80,
                delay: 30
              },
              soilPH: {
                enabled: true,
                min: 5.5,
                max: 7.5,
                delay: 30
              },
              ec: {
                enabled: true,
                min: 0.8,
                max: 1.8,
                delay: 30
              }
            }
          }}
          onFinish={handleSave}
        >
          <Form.Item
            name="enabled"
            label="启用报警系统"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="notificationMethod"
            label="报警通知方式"
            rules={[{ required: true, message: '请选择报警通知方式' }]}
          >
            <StyledSelect
              mode="multiple"
              placeholder="请选择报警通知方式"
              style={{ width: '100%' }}
            >
              <Option value="sound">声音提醒</Option>
              <Option value="message">系统消息</Option>
              <Option value="email">邮件通知</Option>
              <Option value="sms">短信通知</Option>
            </StyledSelect>
          </Form.Item>

          <Title level={5}>空气温度</Title>
          <Form.Item shouldUpdate noStyle>
            {() => (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item
                  name={['thresholds', 'temperature', 'enabled']}
                  valuePropName="checked"
                >
                  <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                </Form.Item>
                <Space>
                  <Form.Item
                    name={['thresholds', 'temperature', 'min']}
                    label="最小值 (°C)"
                  >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'temperature', 'max']}
                    label="最大值 (°C)"
                  >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'temperature', 'delay']}
                    label="延迟报警 (秒)"
                  >
                    <InputNumber min={0} max={300} />
                  </Form.Item>
                </Space>
              </Space>
            )}
          </Form.Item>

          <Title level={5}>空气湿度</Title>
          <Form.Item shouldUpdate noStyle>
            {() => (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item
                  name={['thresholds', 'humidity', 'enabled']}
                  valuePropName="checked"
                >
                  <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                </Form.Item>
                <Space>
                  <Form.Item
                    name={['thresholds', 'humidity', 'min']}
                    label="最小值 (%)"
                  >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'humidity', 'max']}
                    label="最大值 (%)"
                  >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'humidity', 'delay']}
                    label="延迟报警 (秒)"
                  >
                    <InputNumber min={0} max={300} />
                  </Form.Item>
                </Space>
              </Space>
            )}
          </Form.Item>

          <Title level={5}>CO2浓度</Title>
          <Form.Item shouldUpdate noStyle>
            {() => (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item
                  name={['thresholds', 'co2', 'enabled']}
                  valuePropName="checked"
                >
                  <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                </Form.Item>
                <Space>
                  <Form.Item
                    name={['thresholds', 'co2', 'min']}
                    label="最小值 (ppm)"
                  >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'co2', 'max']}
                    label="最大值 (ppm)"
                  >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'co2', 'delay']}
                    label="延迟报警 (秒)"
                  >
                    <InputNumber min={0} max={300} />
                  </Form.Item>
                </Space>
              </Space>
            )}
          </Form.Item>

          <Title level={5}>光照强度</Title>
          <Form.Item shouldUpdate noStyle>
            {() => (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item
                  name={['thresholds', 'light', 'enabled']}
                  valuePropName="checked"
                >
                  <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                </Form.Item>
                <Space>
                  <Form.Item
                    name={['thresholds', 'light', 'min']}
                    label="最小值 (lux)"
                  >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'light', 'max']}
                    label="最大值 (lux)"
                  >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'light', 'delay']}
                    label="延迟报警 (秒)"
                  >
                    <InputNumber min={0} max={300} />
                  </Form.Item>
                </Space>
              </Space>
            )}
          </Form.Item>

          <Title level={5}>土壤湿度</Title>
          <Form.Item shouldUpdate noStyle>
            {() => (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item
                  name={['thresholds', 'soilMoisture', 'enabled']}
                  valuePropName="checked"
                >
                  <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                </Form.Item>
                <Space>
                  <Form.Item
                    name={['thresholds', 'soilMoisture', 'min']}
                    label="最小值 (%)"
                  >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'soilMoisture', 'max']}
                    label="最大值 (%)"
                  >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'soilMoisture', 'delay']}
                    label="延迟报警 (秒)"
                  >
                    <InputNumber min={0} max={300} />
                  </Form.Item>
                </Space>
              </Space>
            )}
          </Form.Item>

          <Title level={5}>土壤pH值</Title>
          <Form.Item shouldUpdate noStyle>
            {() => (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item
                  name={['thresholds', 'soilPH', 'enabled']}
                  valuePropName="checked"
                >
                  <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                </Form.Item>
                <Space>
                  <Form.Item
                    name={['thresholds', 'soilPH', 'min']}
                    label="最小值"
                  >
                    <InputNumber step={0.1} />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'soilPH', 'max']}
                    label="最大值"
                  >
                    <InputNumber step={0.1} />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'soilPH', 'delay']}
                    label="延迟报警 (秒)"
                  >
                    <InputNumber min={0} max={300} />
                  </Form.Item>
                </Space>
              </Space>
            )}
          </Form.Item>

          <Title level={5}>土壤EC值</Title>
          <Form.Item shouldUpdate noStyle>
            {() => (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item
                  name={['thresholds', 'ec', 'enabled']}
                  valuePropName="checked"
                >
                  <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                </Form.Item>
                <Space>
                  <Form.Item
                    name={['thresholds', 'ec', 'min']}
                    label="最小值 (mS/cm)"
                  >
                    <InputNumber step={0.1} />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'ec', 'max']}
                    label="最大值 (mS/cm)"
                  >
                    <InputNumber step={0.1} />
                  </Form.Item>
                  <Form.Item
                    name={['thresholds', 'ec', 'delay']}
                    label="延迟报警 (秒)"
                  >
                    <InputNumber min={0} max={300} />
                  </Form.Item>
                </Space>
              </Space>
            )}
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </StyledCard>
    </div>
  );
};

export default AlarmSettings; 