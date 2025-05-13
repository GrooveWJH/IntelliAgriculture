import React, { useState, useEffect } from 'react';
import { Card, Form, Switch, InputNumber, Button, Typography, Space, Divider, Modal, Slider, Alert, Row, Col, Tabs, Tooltip, Badge } from 'antd';
import {
  SettingOutlined,
  DatabaseOutlined,
  SaveOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  ToolOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useSensorData } from '../contexts/SensorDataContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const PageWrapper = styled.div`
  padding: 16px 0;
`;

const HeaderCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const MaintenanceCard = styled(StyledCard)`
  .warning {
    color: #ff4d4f;
  }
  
  .normal {
    color: #52c41a;
  }
`;

const SliderContainer = styled.div`
  padding: 0 4px;
  margin: 8px 0 30px;
  position: relative;
  
  .ant-slider-rail {
    height: 8px;
    background-color: #f0f0f0;
    border-radius: 4px;
  }
  
  .ant-slider-track {
    transition: width 0.5s ease-in-out;
    height: 8px;
    background-color: #1890ff;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
  }
  
  .ant-slider-handle {
    transition: left 0.5s ease-in-out;
    width: 16px;
    height: 16px;
    margin-top: -4px;
    background-color: white;
    border: 2px solid #1890ff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 50%;
  }
  
  .threshold-value-label {
    position: absolute;
    bottom: -25px;
    padding: 2px 8px;
    background-color: #1890ff;
    color: white;
    border-radius: 10px;
    font-size: 12px;
    font-weight: bold;
    transform: translateX(-50%);
    transition: left 0.5s ease-in-out;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 1;
    white-space: nowrap;
  }
`;

const ThresholdItem = styled.div`
  margin-bottom: 36px;
`;

const SectionTitle = styled(Title)`
  display: flex;
  align-items: center;
  
  .anticon {
    margin-right: 10px;
    color: #1890ff;
  }
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  
  strong {
    margin-right: 8px;
    min-width: 120px;
  }
`;

const ActionButton = styled(Button)`
  margin-right: 12px;
`;

const SaveButtonWrapper = styled.div`
  margin-top: 24px;
  text-align: right;
`;

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Settings: React.FC = () => {
  const { getStorageStats, cleanupOldData } = useSensorData();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>("1");
  const [stats, setStats] = useState({
    totalPoints: 0,
    dbSize: 0,
    oldestData: '',
    newestData: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    const updateStats = async () => {
      // 模拟数据
      const mockDbSize = Math.random() > 0.7 ? 
        Math.floor(Math.random() * 40 * 1024 * 1024) + 30 * 1024 * 1024 : // 30MB-70MB
        Math.floor(Math.random() * 20 * 1024 * 1024) + 10 * 1024 * 1024;  // 10MB-30MB
      
      const dataPoints = Math.floor(Math.random() * 50000) + 50000; // 50,000-100,000
      
      // 生成近期的日期
      const now = dayjs();
      const oldestDate = now.subtract(Math.floor(Math.random() * 30) + 30, 'day'); // 30-60天前
      
      setStats({
        totalPoints: dataPoints,
        dbSize: mockDbSize,
        oldestData: oldestDate.format('YYYY-MM-DD HH:mm:ss'),
        newestData: now.format('YYYY-MM-DD HH:mm:ss')
      });
    };

    // 立即更新一次
    updateStats();

    // 每5秒更新一次，模拟数据变化
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSave = async (values: any) => {
    setIsUpdating(true);
    
    try {
      console.log('保存设置:', values);
      // TODO: 实现设置保存逻辑
      
      // 模拟保存延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('保存设置失败:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCleanup = () => {
    Modal.confirm({
      title: '确认清理数据',
      content: '这将删除一周以前的所有数据，确定要继续吗？',
      icon: <WarningOutlined style={{ color: '#faad14' }} />,
      okText: '确认清理',
      okButtonProps: { danger: true, icon: <DeleteOutlined /> },
      cancelText: '取消',
      onOk: async () => {
        setIsUpdating(true);
        try {
          // 模拟数据清理操作延迟
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          // 模拟清理后的数据
          const now = dayjs();
          const oneWeekAgo = now.subtract(7, 'day');
          
          // 模拟数据减少约70%
          const reducedPoints = Math.floor(stats.totalPoints * 0.3);
          const reducedSize = Math.floor(stats.dbSize * 0.3);
          
          setStats({
            totalPoints: reducedPoints,
            dbSize: reducedSize,
            oldestData: oneWeekAgo.format('YYYY-MM-DD HH:mm:ss'),
            newestData: now.format('YYYY-MM-DD HH:mm:ss')
          });
          
          setUpdateSuccess(true);
          setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (error) {
          console.error('清理数据失败:', error);
        } finally {
          setIsUpdating(false);
        }
      }
    });
  };

  const getDatabaseSizeStatus = () => {
    const isNearLimit = stats.dbSize > 90 * 1024 * 1024; // 90MB warning threshold
    const isLarge = stats.dbSize > 50 * 1024 * 1024; // 50MB
    
    if (isNearLimit) {
      return { status: 'error', text: '接近存储限制' };
    } else if (isLarge) {
      return { status: 'warning', text: '体积较大' };
    }
    return { status: 'success', text: '正常' };
  };
  
  const getThresholdStateText = (min: number, max: number, current: number | undefined) => {
    if (current === undefined) return { status: 'default', text: '无数据' };
    
    if (current < min) {
      return { status: 'error', text: '低于警戒值' };
    } else if (current > max) {
      return { status: 'error', text: '高于警戒值' };
    }
    return { status: 'success', text: '正常范围内' };
  };
  
  const dbSizeStatus = getDatabaseSizeStatus();
  
  // 渲染控制模式悬停提示说明
  const renderThresholdTooltip = (paramName: string, unit: string) => {
    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#2a2a2a',
        color: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        maxWidth: '400px'
      }}>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          borderBottom: '1px solid #555', 
          paddingBottom: '12px', 
          marginBottom: '12px', 
          color: '#1890ff' 
        }}>
          {paramName}警戒阈值说明
        </div>
        
        <div style={{ 
          marginBottom: '16px', 
          lineHeight: '1.8',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.95)'
        }}>
          当{paramName}超出设定的最小值和最大值范围时，系统将发出警报提醒。合理设置阈值可以确保作物处于最佳生长环境。
        </div>
        
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '12px 16px', 
          borderRadius: '6px', 
          marginBottom: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#faad14', fontSize: '14px' }}>
            建议设置范围 ({unit})：
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.7' }}>
            {
              paramName === '温度' ? '15°C - 30°C (适合大多数作物生长)' :
              paramName === '湿度' ? '40% - 80% (确保植物正常蒸腾作用)' :
              paramName === 'CO2浓度' ? '350ppm - 1000ppm (提高光合作用效率)' :
              paramName === '光照强度' ? '1000lux - 100000lux (满足不同阶段作物需求)' :
              '请根据作物需求调整'
            }
          </div>
        </div>
      </div>
    );
  };

  // 渲染阈值设置滑块
  const renderThresholdSlider = (name: string, unit: string, min: number, max: number, paramMin: number, paramMax: number) => {
    return (
      <ThresholdItem>
        <Row align="middle">
          <Col flex="auto">
            <Form.Item 
              label={
                <Space>
                  <span>{name} ({unit})</span>
                  <Tooltip title={renderThresholdTooltip(name, unit)} color="transparent">
                    <QuestionCircleOutlined style={{ cursor: 'help' }} />
                  </Tooltip>
                </Space>
              } 
              required
            >
              <SliderContainer>
                <Slider
                  range
                  min={min}
                  max={max}
                  defaultValue={[paramMin, paramMax]}
                  onChange={(value) => {
                    if (Array.isArray(value)) {
                      form.setFieldsValue({
                        warningThreshold: {
                          ...form.getFieldValue('warningThreshold'),
                          [name === '温度' ? 'temperature' : 
                            name === '湿度' ? 'humidity' : 
                            name === 'CO2浓度' ? 'co2' : 'light']: {
                            min: value[0],
                            max: value[1]
                          }
                        }
                      });
                    }
                  }}
                />
                <div className="threshold-value-label" style={{ left: `${(paramMin - min) / (max - min) * 100}%` }}>
                  {paramMin}{unit}
                </div>
                <div className="threshold-value-label" style={{ left: `${(paramMax - min) / (max - min) * 100}%` }}>
                  {paramMax}{unit}
                </div>
              </SliderContainer>
              <Row>
                <Col span={12}>
                  <Form.Item 
                    name={['warningThreshold', name === '温度' ? 'temperature' : name === '湿度' ? 'humidity' : name === 'CO2浓度' ? 'co2' : 'light', 'min']}
                    noStyle
                  >
                    <InputNumber 
                      placeholder="最小值" 
                      style={{ width: '100%' }} 
                      min={min} 
                      max={max} 
                      addonBefore="最小值"
                      addonAfter={unit}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    name={['warningThreshold', name === '温度' ? 'temperature' : name === '湿度' ? 'humidity' : name === 'CO2浓度' ? 'co2' : 'light', 'max']}
                    noStyle
                  >
                    <InputNumber 
                      placeholder="最大值" 
                      style={{ width: '100%' }} 
                      min={min} 
                      max={max} 
                      addonBefore="最大值"
                      addonAfter={unit}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form.Item>
          </Col>
        </Row>
      </ThresholdItem>
    );
  };
  
  // 渲染基本设置表单
  const renderBasicSettings = () => {
    return (
      <StyledCard
        title={
          <SectionTitle level={4}>
            <SettingOutlined /> 基本设置
          </SectionTitle>
        }
      >
        <Form.Item
          name="dataUpdateInterval"
          label="数据更新间隔"
          rules={[{ required: true, message: '请输入数据更新间隔' }]}
          tooltip="系统从传感器读取数据的时间间隔，影响数据采集频率"
        >
          <InputNumber 
            min={1} 
            max={60} 
            style={{ width: '100%' }}
            addonAfter="秒"
          />
        </Form.Item>

        <Form.Item
          name="systemUpdateInterval"
          label="系统状态更新间隔"
          rules={[{ required: true, message: '请输入系统状态更新间隔' }]}
          tooltip="系统检查设备状态和控制系统的时间间隔，影响系统响应速度"
        >
          <InputNumber 
            min={1} 
            max={60} 
            style={{ width: '100%' }}
            addonAfter="秒"
          >
          </InputNumber>
        </Form.Item>
        
        <Form.Item
          name="automaticOptimization"
          label="自动优化控制参数"
          valuePropName="checked"
          tooltip="启用后系统将根据历史数据自动调整控制参数，提高控制精度"
        >
          <Switch 
            checkedChildren="开启" 
            unCheckedChildren="关闭"
          />
        </Form.Item>
        
        <Form.Item
          name="weatherDriven"
          label="天气数据驱动"
          valuePropName="checked"
          tooltip="启用后系统将考虑外部天气因素，自动调整控制策略"
        >
          <Switch 
            checkedChildren="开启" 
            unCheckedChildren="关闭"
          />
        </Form.Item>
      </StyledCard>
    );
  };
  
  // 渲染警戒阈值设置表单
  const renderWarningThresholds = () => {
    return (
      <StyledCard
        title={
          <SectionTitle level={4}>
            <WarningOutlined /> 警戒阈值设置
          </SectionTitle>
        }
      >
        <Alert
          message="设置环境参数警戒范围"
          description="当环境参数超出设定范围时，系统将发出警报。请根据作物品种需求合理设置阈值范围。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        {renderThresholdSlider('温度', '°C', -10, 50, 15, 30)}
        {renderThresholdSlider('湿度', '%', 0, 100, 40, 80)}
        {renderThresholdSlider('CO2浓度', 'ppm', 0, 2000, 350, 1000)}
        {renderThresholdSlider('光照强度', 'lux', 0, 150000, 1000, 100000)}
      </StyledCard>
    );
  };
  
  // 渲染系统维护部分
  const renderMaintenance = () => {
    return (
      <MaintenanceCard
        title={
          <SectionTitle level={4}>
            <ToolOutlined /> 系统维护
          </SectionTitle>
        }
      >
        <Alert
          message={updateSuccess ? "操作成功" : "系统数据维护"}
          description={updateSuccess ? "数据清理操作已完成，数据库大小已更新" : "这里显示系统数据库状态，您可以清理旧数据以释放存储空间。"}
          type={updateSuccess ? "success" : "info"}
          showIcon
          icon={updateSuccess ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
          style={{ marginBottom: 24 }}
        />
        
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <StatusItem>
              <strong>数据库大小：</strong>
              <Badge 
                status={dbSizeStatus.status as any} 
                text={
                  <Space>
                    <span className={dbSizeStatus.status === 'error' ? 'warning' : dbSizeStatus.status === 'success' ? 'normal' : ''}>
                      {formatBytes(stats.dbSize)}
                    </span>
                    <Text type={dbSizeStatus.status === 'error' ? 'danger' : dbSizeStatus.status === 'warning' ? 'warning' : undefined}>
                      ({dbSizeStatus.text})
                    </Text>
                  </Space>
                } 
              />
            </StatusItem>
          </Col>
          <Col span={12}>
            <StatusItem>
              <strong>数据点数量：</strong>
              <Badge status="processing" text={<span>{stats.totalPoints.toLocaleString()} 个</span>} />
            </StatusItem>
          </Col>
          <Col span={12}>
            <StatusItem>
              <strong>最早数据时间：</strong>
              <span>{stats.oldestData}</span>
            </StatusItem>
          </Col>
          <Col span={12}>
            <StatusItem>
              <strong>最新数据时间：</strong>
              <span>{stats.newestData}</span>
            </StatusItem>
          </Col>
        </Row>
        
        <Divider style={{ margin: '12px 0 24px' }} />
        
        <Row>
          <Col span={24}>
            <Space>
              <ActionButton 
                type="primary" 
                danger 
                icon={<DeleteOutlined />}
                onClick={handleCleanup}
                loading={isUpdating}
              >
                清理旧数据
              </ActionButton>
              <ActionButton
                icon={<DatabaseOutlined />}
                onClick={() => {/* TODO: 实现数据库备份功能 */}}
              >
                备份数据库
              </ActionButton>
              <ActionButton
                icon={<ReloadOutlined />}
                onClick={async () => {
                  setIsUpdating(true);
                  
                  // 模拟加载延迟
                  await new Promise(resolve => setTimeout(resolve, 800));
                  
                  // 模拟刷新后的数据
                  const mockDbSize = Math.random() > 0.7 ? 
                    Math.floor(Math.random() * 40 * 1024 * 1024) + 30 * 1024 * 1024 : 
                    Math.floor(Math.random() * 20 * 1024 * 1024) + 10 * 1024 * 1024;
                  
                  const dataPoints = Math.floor(Math.random() * 50000) + 50000;
                  const now = dayjs();
                  const oldestDate = now.subtract(Math.floor(Math.random() * 30) + 30, 'day');
                  
                  setStats({
                    totalPoints: dataPoints,
                    dbSize: mockDbSize,
                    oldestData: oldestDate.format('YYYY-MM-DD HH:mm:ss'),
                    newestData: now.format('YYYY-MM-DD HH:mm:ss')
                  });
                  
                  setIsUpdating(false);
                }}
                loading={isUpdating}
              >
                刷新统计
              </ActionButton>
            </Space>
          </Col>
        </Row>
      </MaintenanceCard>
    );
  };

  return (
    <PageWrapper>
      <HeaderCard>
        <Row align="middle" gutter={16}>
          <Col>
            <SettingOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </Col>
          <Col flex="1">
            <Title level={2} style={{ margin: 0 }}>系统设置</Title>
            <Paragraph style={{ marginBottom: 0 }}>
              配置系统基本参数、告警阈值和维护选项，确保大棚环境控制系统高效稳定运行
            </Paragraph>
          </Col>
        </Row>
      </HeaderCard>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <Space>
              <SettingOutlined />
              <span>基本设置</span>
            </Space>
          } 
          key="1"
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              dataUpdateInterval: 1,
              systemUpdateInterval: 5,
              automaticOptimization: true,
              weatherDriven: true,
              warningThreshold: {
                temperature: { min: 15, max: 30 },
                humidity: { min: 40, max: 80 },
                co2: { min: 350, max: 1000 },
                light: { min: 1000, max: 100000 }
              }
            }}
            onFinish={handleSave}
          >
            {renderBasicSettings()}
            
            {renderWarningThresholds()}
            
            <SaveButtonWrapper>
              <Button 
                type="default" 
                style={{ marginRight: 12 }}
                onClick={() => form.resetFields()}
              >
                重置
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={isUpdating}
              >
                保存设置
              </Button>
            </SaveButtonWrapper>
          </Form>
        </TabPane>
        
        <TabPane 
          tab={
            <Space>
              <ToolOutlined />
              <span>系统维护</span>
            </Space>
          } 
          key="2"
        >
          {renderMaintenance()}
        </TabPane>
      </Tabs>
    </PageWrapper>
  );
};

export default Settings; 