import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  InputNumber, 
  Switch, 
  Select, 
  Button, 
  Typography, 
  Space, 
  message, 
  Row, 
  Col, 
  Divider, 
  Tabs,
  Tooltip,
  Alert,
  Slider,
  Badge
} from 'antd';
import { 
  BellOutlined, 
  WarningOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  SaveOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  SoundOutlined,
  MailOutlined,
  MessageOutlined,
  MobileOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useSensorData } from '../contexts/SensorDataContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// 样式组件
const PageWrapper = styled.div`
  padding: 24px;
  background-color: #f7f9fc;
  min-height: calc(100vh - 64px);
`;

const HeaderCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ThresholdCard = styled(Card)<{ isActive: boolean }>`
  margin-bottom: 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid ${props => props.isActive ? '#1890ff' : '#f0f0f0'};
  opacity: ${props => props.isActive ? 1 : 0.7};
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .ant-card-head {
    background-color: ${props => props.isActive ? 'rgba(24, 144, 255, 0.05)' : 'inherit'};
    border-bottom: 1px solid ${props => props.isActive ? '#e6f7ff' : '#f0f0f0'};
  }
`;

const ThresholdSlider = styled(Slider)`
  margin: 16px 8px 8px;
  
  /* 移除所有动画效果，确保滑块和轨道同步移动 */
  &, .ant-slider-rail, .ant-slider-track, .ant-slider-handle {
    transition: none !important;
  }
  
  .ant-slider-rail {
    background-color: #f0f0f0;
    height: 8px;
  }
  
  .ant-slider-track {
    background-color: #91d5ff;
    height: 8px;
  }
  
  .ant-slider-handle {
    width: 16px;
    height: 16px;
    margin-top: -4px;
    background-color: white;
    border: 2px solid #1890ff;
    box-shadow: none;
    outline: none;
    border-radius: 50%;
  }

  .ant-slider-handle::before,
  .ant-slider-handle::after {
    display: none;
  }
  
  /* 确保禁用状态的样式正确 */
  &.ant-slider-disabled {
    .ant-slider-rail {
      background-color: #f5f5f5;
    }
    .ant-slider-track {
      background-color: #e1e1e1;
    }
    .ant-slider-handle {
      border-color: #d9d9d9;
      background-color: #fff;
    }
  }
`;

const ControlPanel = styled.div`
  position: sticky;
  bottom: 24px;
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 24px;
  z-index: 10;
`;

const ParameterLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const NotificationMethodIcon = styled.div<{ isActive: boolean }>`
  font-size: 24px;
  padding: 12px;
  border-radius: 8px;
  background-color: ${props => props.isActive ? 'rgba(24, 144, 255, 0.1)' : '#f0f0f0'};
  color: ${props => props.isActive ? '#1890ff' : '#8c8c8c'};
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => props.isActive ? 'rgba(24, 144, 255, 0.2)' : '#e6e6e6'};
  }
`;

// 参数配置
const parameterConfig = {
  temperature: {
    name: '空气温度',
    unit: '°C',
    icon: <InfoCircleOutlined style={{ color: '#faad14' }} />,
    min: 0,
    max: 50,
    criticalMin: 10,
    criticalMax: 35,
    description: '大棚内空气温度，过高或过低会影响植物生长'
  },
  humidity: {
    name: '空气湿度',
    unit: '%',
    icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
    min: 0,
    max: 100,
    criticalMin: 30,
    criticalMax: 90,
    description: '大棚内空气湿度，影响植物蒸腾和病害发生'
  },
  co2: {
    name: 'CO2浓度',
    unit: 'ppm',
    icon: <InfoCircleOutlined style={{ color: '#52c41a' }} />,
    min: 0,
    max: 2000,
    criticalMin: 300,
    criticalMax: 1200,
    description: '大棚内二氧化碳浓度，影响植物光合作用效率'
  },
  light: {
    name: '光照强度',
    unit: 'lux',
    icon: <InfoCircleOutlined style={{ color: '#fa8c16' }} />,
    min: 0,
    max: 150000,
    criticalMin: 1000,
    criticalMax: 100000,
    description: '植物接收的光照强度，直接影响光合作用和生长'
  },
  soilMoisture: {
    name: '土壤湿度',
    unit: '%',
    icon: <InfoCircleOutlined style={{ color: '#722ed1' }} />,
    min: 0,
    max: 100,
    criticalMin: 20,
    criticalMax: 80,
    description: '土壤含水量，影响植物根系吸水和养分吸收'
  },
  soilPH: {
    name: '土壤pH值',
    unit: '',
    icon: <InfoCircleOutlined style={{ color: '#eb2f96' }} />,
    min: 4,
    max: 9,
    criticalMin: 5.5,
    criticalMax: 7.5,
    description: '土壤酸碱度，影响养分有效性和微生物活性'
  },
  ec: {
    name: '电导率',
    unit: 'mS/cm',
    icon: <InfoCircleOutlined style={{ color: '#f5222d' }} />,
    min: 0,
    max: 5,
    criticalMin: 0.8,
    criticalMax: 1.8,
    description: '表示土壤中可溶性盐的含量，与肥力相关'
  }
};

// 通知方式配置
const notificationMethods = [
  { 
    key: 'sound', 
    icon: <SoundOutlined />, 
    name: '声音提醒', 
    description: '通过系统声音提醒操作员',
    available: false
  },
  { 
    key: 'message', 
    icon: <MessageOutlined />, 
    name: '系统消息', 
    description: '在系统界面显示通知消息',
    available: true
  },
  { 
    key: 'email', 
    icon: <MailOutlined />, 
    name: '邮件通知', 
    description: '发送邮件到配置的邮箱地址',
    available: false
  },
  { 
    key: 'sms', 
    icon: <MobileOutlined />, 
    name: '短信通知', 
    description: '发送短信到配置的手机号码',
    available: false
  }
];

const AlarmSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('1');
  const [currentForm, setCurrentForm] = useState<any>(null);
  
  // 初始化时设置currentForm为form的初始值
  useEffect(() => {
    const initialValues = form.getFieldsValue(true);
    setCurrentForm({...initialValues});
    
    // 调试输出
    console.log('初始化表单值:', initialValues);
  }, []);
  
  // 当表单值改变时更新状态
  const handleValuesChange = (changedValues: any, allValues: any) => {
    // 调试输出
    console.log('表单值变化:', changedValues, '所有值:', allValues);
    setCurrentForm({...allValues});
  };

  const handleSave = async (values: any) => {
    console.log('保存报警设置:', values);
    // TODO: 实现保存逻辑
    message.success('报警设置已保存');
  };
  
  // 渲染通知方式选择
  const renderNotificationMethods = (values: any) => {
    const selectedMethods = values?.notificationMethod || [];
    
    return (
      <Row gutter={16} style={{ marginTop: 16 }}>
        {notificationMethods.map(method => (
          <Col key={method.key} span={6}>
            <NotificationMethodIcon 
              isActive={selectedMethods.includes(method.key)}
              onClick={() => {
                if (!method.available && !selectedMethods.includes(method.key)) {
                  message.info(`${method.name}功能正在开发中，暂不可用`);
                  return;
                }
                
                const newMethods = selectedMethods.includes(method.key)
                  ? selectedMethods.filter((key: string) => key !== method.key)
                  : [...selectedMethods, method.key];
                
                form.setFieldsValue({ notificationMethod: newMethods });
                
                // 强制立即更新表单状态
                const newValues = form.getFieldsValue(true);
                setCurrentForm({...newValues});
              }}
            >
              {method.icon}
              <div style={{ fontSize: 14, marginTop: 8 }}>
                {method.name}
                {!method.available && 
                  <Badge 
                    count="开发中" 
                    style={{ 
                      backgroundColor: '#faad14',
                      fontSize: '10px',
                      marginLeft: '5px',
                      transform: 'scale(0.8)'
                    }} 
                  />
                }
              </div>
            </NotificationMethodIcon>
          </Col>
        ))}
      </Row>
    );
  };
  
  // 渲染参数阈值设置卡片
  const renderThresholdCard = (paramKey: keyof typeof parameterConfig, values: any) => {
    const param = parameterConfig[paramKey];
    // 确保正确获取全局和参数启用状态
    const globalEnabled = values?.enabled === true; 
    const isEnabled = values?.thresholds?.[paramKey]?.enabled === true;
    const minValue = values?.thresholds?.[paramKey]?.min || param.criticalMin;
    const maxValue = values?.thresholds?.[paramKey]?.max || param.criticalMax;
    const delay = values?.thresholds?.[paramKey]?.delay || 30;
    
    // 组件是否应该被禁用：当全局禁用或当前参数禁用时
    const isDisabled = !globalEnabled || !isEnabled;
    
    console.log(`${paramKey} - globalEnabled: ${globalEnabled}, isEnabled: ${isEnabled}, isDisabled: ${isDisabled}`);
    
    return (
      <ThresholdCard 
        isActive={isEnabled && globalEnabled} 
        title={
          <ParameterLabel>
            {param.icon}
            <Text strong>{param.name}</Text>
            <Switch 
              checked={isEnabled}
              disabled={!globalEnabled} // 全局禁用时，单个开关也禁用
              onChange={checked => {
                const newThresholds = {
                  ...values?.thresholds,
                  [paramKey]: {
                    ...values?.thresholds?.[paramKey],
                    enabled: checked
                  }
                };
                form.setFieldsValue({
                  thresholds: newThresholds
                });
                
                // 强制立即更新表单状态
                const newValues = form.getFieldsValue(true);
                setCurrentForm({...newValues}); 
              }}
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
            <Tooltip title={param.description}>
              <QuestionCircleOutlined style={{ marginLeft: 8, color: '#8c8c8c' }} />
            </Tooltip>
          </ParameterLabel>
        }
      >
        <Paragraph type="secondary">{param.description}</Paragraph>
        
        <Row align="middle" style={{ padding: '0 16px' }}>
          <Col span={4}>
            <Badge color="red" text={`最小值: ${minValue}${param.unit}`} />
          </Col>
          <Col span={16}>
            <ThresholdSlider
              range
              disabled={isDisabled}
              min={param.min}
              max={param.max}
              value={[minValue, maxValue]}
              onChange={(value: number[]) => {
                if (isDisabled) return; // 再次确认禁用状态
                
                const newThresholds = {
                  ...values?.thresholds,
                  [paramKey]: {
                    ...values?.thresholds?.[paramKey],
                    min: value[0],
                    max: value[1]
                  }
                };
                
                form.setFieldsValue({
                  thresholds: newThresholds
                });
                
                // 强制立即更新表单状态
                const newValues = form.getFieldsValue(true);
                setCurrentForm({...newValues});
              }}
            />
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <Badge color="green" text={`最大值: ${maxValue}${param.unit}`} />
          </Col>
        </Row>
        
        <Row align="middle" style={{ marginTop: 16 }}>
          <Col span={14} offset={2}>
            <Text type="secondary">超出阈值延迟报警时间:</Text>
          </Col>
          <Col span={8}>
            <InputNumber
              disabled={isDisabled}
              min={0}
              max={300}
              value={delay}
              onChange={value => {
                if (isDisabled) return; // 再次确认禁用状态
                
                const newThresholds = {
                  ...values?.thresholds,
                  [paramKey]: {
                    ...values?.thresholds?.[paramKey],
                    delay: value
                  }
                };
                
                form.setFieldsValue({
                  thresholds: newThresholds
                });
                
                // 强制立即更新表单状态
                const newValues = form.getFieldsValue(true);
                setCurrentForm({...newValues});
              }}
              addonAfter="秒"
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </ThresholdCard>
    );
  };

  return (
    <PageWrapper>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            enabled: true,
          notificationMethod: ['message'],
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
        onValuesChange={handleValuesChange}
      >
        <HeaderCard>
          <Row align="middle" gutter={16}>
            <Col>
              <BellOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </Col>
            <Col flex="1">
              <Title level={2} style={{ margin: 0 }}>报警设置</Title>
              <Paragraph style={{ marginBottom: 0 }}>
                配置系统关键参数的报警阈值和通知方式，保障大棚运行安全
              </Paragraph>
            </Col>
            <Col>
              <Form.Item name="enabled" valuePropName="checked" noStyle>
                <Switch 
                  checkedChildren="报警系统已启用" 
                  unCheckedChildren="报警系统已禁用"
                  style={{ marginRight: 16 }}
                />
          </Form.Item>
            </Col>
          </Row>
        </HeaderCard>
        
        <Alert 
          message="报警系统说明" 
          description="当环境参数超出设定阈值并持续指定时间后，系统将通过选定的通知方式发出警报。合理设置阈值和延迟时间可避免频繁误报。" 
          type="info" 
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <StyledCard title={
          <Space>
            <SettingOutlined />
            <span>通知方式</span>
          </Space>
        }>
          <Paragraph>选择当参数超出阈值时需要触发的通知方式（可多选）</Paragraph>
          
          <Form.Item name="notificationMethod" hidden>
            <Select mode="multiple" />
          </Form.Item>

          <Form.Item shouldUpdate>
            {({ getFieldsValue }) => {
              const values = getFieldsValue(true);
              return renderNotificationMethods(values);
            }}
          </Form.Item>
        </StyledCard>
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
                <Space>
                <WarningOutlined />
                <span>环境参数报警</span>
              </Space>
            } 
            key="1"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item shouldUpdate>
                  {({ getFieldsValue }) => {
                    const values = getFieldsValue(true);
                    return renderThresholdCard('temperature', values);
                  }}
                </Form.Item>

                <Form.Item shouldUpdate>
                  {({ getFieldsValue }) => {
                    const values = getFieldsValue(true);
                    return renderThresholdCard('humidity', values);
                  }}
                </Form.Item>
                
                <Form.Item shouldUpdate>
                  {({ getFieldsValue }) => {
                    const values = getFieldsValue(true);
                    return renderThresholdCard('co2', values);
                  }}
                </Form.Item>

                <Form.Item shouldUpdate>
                  {({ getFieldsValue }) => {
                    const values = getFieldsValue(true);
                    return renderThresholdCard('light', values);
                  }}
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Form.Item shouldUpdate>
                   {({ getFieldsValue }) => {
                     const values = getFieldsValue(true);
                     return renderThresholdCard('soilMoisture', values);
                   }}
                  </Form.Item>

                 <Form.Item shouldUpdate>
                   {({ getFieldsValue }) => {
                     const values = getFieldsValue(true);
                     return renderThresholdCard('soilPH', values);
                   }}
                  </Form.Item>

                 <Form.Item shouldUpdate>
                   {({ getFieldsValue }) => {
                     const values = getFieldsValue(true);
                     return renderThresholdCard('ec', values);
                   }}
                </Form.Item>
              </Col>
            </Row>
          </TabPane>
          
          <TabPane 
            tab={
                <Space>
                <ExclamationCircleOutlined />
                <span>系统异常报警</span>
              </Space>
            } 
            key="2"
          >
            <Alert
              message="系统异常报警功能正在开发中"
              description="此功能将在后续版本中提供，包括设备故障、网络中断、传感器失效等异常情况的报警设置。"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </TabPane>
          
          <TabPane 
            tab={
                <Space>
                <FileTextOutlined />
                <span>历史报警记录</span>
              </Space>
            } 
            key="3"
          >
            <Alert
              message="历史报警记录功能正在开发中"
              description="此功能将在后续版本中提供，包括历史报警事件的查询、统计和导出功能。"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </TabPane>
        </Tabs>

        <ControlPanel>
          <Button size="large" onClick={() => form.resetFields()}>
            重置
          </Button>
          <Button 
            type="primary" 
            size="large" 
            htmlType="submit" 
            icon={<SaveOutlined />}
          >
              保存设置
            </Button>
        </ControlPanel>
        </Form>
    </PageWrapper>
  );
};

export default AlarmSettings; 