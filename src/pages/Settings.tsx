import React, { useState, useEffect } from 'react';
import { Card, Form, Switch, InputNumber, Button, Typography, Space, Divider, Modal } from 'antd';
import styled from 'styled-components';
import { useSensorData } from '../contexts/SensorDataContext';
import dayjs from 'dayjs';

const { Title } = Typography;

const StyledCard = styled(Card)`
  margin: 20px;
`;

const MaintenanceCard = styled(Card)`
  margin: 20px;
  .ant-statistic-content {
    font-size: 16px;
  }
  .warning {
    color: #ff4d4f;
  }
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
  const [stats, setStats] = useState({
    totalPoints: 0,
    dbSize: 0,
    oldestData: '',
    newestData: ''
  });

  useEffect(() => {
    const updateStats = async () => {
      const currentStats = await getStorageStats();
      setStats({
        totalPoints: currentStats.totalPoints,
        dbSize: currentStats.dbSize,
        oldestData: dayjs(currentStats.oldestData).format('YYYY-MM-DD HH:mm:ss'),
        newestData: dayjs(currentStats.newestData).format('YYYY-MM-DD HH:mm:ss')
      });
    };

    // 立即更新一次
    updateStats();

    // 每秒更新一次
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, [getStorageStats]);

  const handleSave = async (values: any) => {
    console.log('保存设置:', values);
    // TODO: 实现设置保存逻辑
  };

  const handleCleanup = () => {
    Modal.confirm({
      title: '确认清理数据',
      content: '这将删除一周以前的所有数据，确定要继续吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const oneWeekAgo = dayjs().subtract(1, 'week').valueOf();
        await cleanupOldData(oneWeekAgo);
      }
    });
  };

  const isNearLimit = stats.dbSize > 90 * 1024 * 1024; // 90MB warning threshold

  return (
    <div>
      <StyledCard>
        <Title level={4}>基本设置</Title>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            dataUpdateInterval: 1,
            systemUpdateInterval: 5,
            warningThreshold: {
              temperature: { min: 15, max: 30 },
              humidity: { min: 40, max: 80 },
              co2: { min: 350, max: 1000 },
              light: { min: 1000, max: 100000 }
            }
          }}
          onFinish={handleSave}
        >
          <Form.Item
            name="dataUpdateInterval"
            label="数据更新间隔 (秒)"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={60} />
          </Form.Item>

          <Form.Item
            name="systemUpdateInterval"
            label="系统状态更新间隔 (秒)"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={60} />
          </Form.Item>

          <Divider />
          <Title level={4}>警戒阈值设置</Title>

          <Form.Item label="温度 (°C)" required>
            <Space>
              <Form.Item name={['warningThreshold', 'temperature', 'min']}>
                <InputNumber placeholder="最小值" />
              </Form.Item>
              <span>-</span>
              <Form.Item name={['warningThreshold', 'temperature', 'max']}>
                <InputNumber placeholder="最大值" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item label="湿度 (%)" required>
            <Space>
              <Form.Item name={['warningThreshold', 'humidity', 'min']}>
                <InputNumber placeholder="最小值" />
              </Form.Item>
              <span>-</span>
              <Form.Item name={['warningThreshold', 'humidity', 'max']}>
                <InputNumber placeholder="最大值" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item label="CO2浓度 (ppm)" required>
            <Space>
              <Form.Item name={['warningThreshold', 'co2', 'min']}>
                <InputNumber placeholder="最小值" />
              </Form.Item>
              <span>-</span>
              <Form.Item name={['warningThreshold', 'co2', 'max']}>
                <InputNumber placeholder="最大值" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item label="光照强度 (lux)" required>
            <Space>
              <Form.Item name={['warningThreshold', 'light', 'min']}>
                <InputNumber placeholder="最小值" />
              </Form.Item>
              <span>-</span>
              <Form.Item name={['warningThreshold', 'light', 'max']}>
                <InputNumber placeholder="最大值" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </StyledCard>

      <MaintenanceCard>
        <Title level={4}>系统维护</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>数据库大小：</strong>
            <span className={isNearLimit ? 'warning' : ''}>
              {formatBytes(stats.dbSize)}
              {isNearLimit && ' (接近限制大小)'}
            </span>
          </div>
          <div>
            <strong>数据点数量：</strong> {stats.totalPoints.toLocaleString()} 个
          </div>
          <div>
            <strong>最早数据时间：</strong> {stats.oldestData}
          </div>
          <div>
            <strong>最新数据时间：</strong> {stats.newestData}
          </div>
          <div style={{ marginTop: '20px' }}>
            <Button type="primary" danger onClick={handleCleanup}>
              清理旧数据
            </Button>
          </div>
        </Space>
      </MaintenanceCard>
    </div>
  );
};

export default Settings; 