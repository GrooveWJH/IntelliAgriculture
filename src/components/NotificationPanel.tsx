import React, { useState, useEffect } from 'react';
import { Badge, Typography, Space, Card } from 'antd';
import styled from 'styled-components';
import {
  BellOutlined,
  CloseOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  CloseCircleFilled,
  DoubleLeftOutlined,
  DoubleRightOutlined
} from '@ant-design/icons';
import { useSensorData } from '../contexts/SensorDataContext';
import { parameterConfig } from '../pages/Dashboard';

const { Text } = Typography;

const NotificationContainer = styled.div<{ collapsed: boolean }>`
  position: fixed;
  right: ${props => props.collapsed ? '-320px' : '0'};
  top: 64px;
  width: 320px;
  transition: right 0.3s ease;
  z-index: 1000;
  background: var(--card-background);
  border-radius: var(--border-radius) 0 0 var(--border-radius);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--text-secondary);
    border-radius: 3px;
  }
`;

const CollapseButton = styled.button<{ collapsed: boolean }>`
  position: absolute;
  left: -32px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 64px;
  border: none;
  background: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  border-radius: 4px 0 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1890ff;
  transition: background-color 0.3s;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const StyledCard = styled(Card)`
  border: none;
  border-radius: 0;
  background: transparent;
  
  .ant-card-head {
    padding: 16px;
    min-height: 40px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    
    .ant-card-head-title {
      padding: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  
  .ant-card-body {
    padding: 16px;
  }
`;

const NotificationItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 8px;
  background: var(--background-color);
  border-radius: var(--border-radius);
  transition: all var(--transition-speed);

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    transform: translateX(-4px);
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.05);
  }
`;

const StatusIcon = styled.span<{ status: 'success' | 'warning' | 'error' }>`
  font-size: 16px;
  margin-right: 12px;
  margin-top: 2px;
  color: ${({ status }) =>
    status === 'success'
      ? 'var(--secondary-color)'
      : status === 'warning'
      ? '#faad14'
      : '#f5222d'};
`;

const StatusBadge = styled(Badge)`
  .ant-badge-status-dot {
    width: 8px;
    height: 8px;
  }
`;

interface NotificationData {
  parameter: string;
  value: number;
  unit: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
  switch (status) {
    case 'success':
      return <CheckCircleFilled />;
    case 'warning':
      return <ExclamationCircleFilled />;
    case 'error':
      return <CloseCircleFilled />;
  }
};

const getStatusColor = (status: 'success' | 'warning' | 'error') => {
  switch (status) {
    case 'success':
      return 'var(--secondary-color)';
    case 'warning':
      return '#faad14';
    case 'error':
      return '#f5222d';
  }
};

const formatNumber = (value: number) => {
  return Number(value.toFixed(2));
};

const NotificationPanel: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { sensorData } = useSensorData();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (sensorData) {
      const newNotifications: NotificationData[] = [
        {
          parameter: '空气温度',
          value: sensorData.airTemperature,
          unit: '°C',
          status: sensorData.airTemperature > parameterConfig.airTemperature.errorThreshold ? 'error' :
                 sensorData.airTemperature > parameterConfig.airTemperature.warningThreshold ? 'warning' : 'success',
          message: sensorData.airTemperature > parameterConfig.airTemperature.errorThreshold ? '温度过高' :
                  sensorData.airTemperature > parameterConfig.airTemperature.warningThreshold ? '温度偏高' : '温度正常'
        },
        {
          parameter: '空气湿度',
          value: sensorData.airHumidity,
          unit: '%',
          status: sensorData.airHumidity > parameterConfig.airHumidity.errorThreshold ? 'error' :
                 sensorData.airHumidity > parameterConfig.airHumidity.warningThreshold ? 'warning' : 'success',
          message: sensorData.airHumidity > parameterConfig.airHumidity.errorThreshold ? '湿度过高' :
                  sensorData.airHumidity > parameterConfig.airHumidity.warningThreshold ? '湿度偏高' : '湿度正常'
        },
        {
          parameter: 'CO2浓度',
          value: sensorData.co2Level,
          unit: 'ppm',
          status: sensorData.co2Level > parameterConfig.co2Level.errorThreshold ? 'error' :
                 sensorData.co2Level > parameterConfig.co2Level.warningThreshold ? 'warning' : 'success',
          message: sensorData.co2Level > parameterConfig.co2Level.errorThreshold ? 'CO2浓度过高' :
                  sensorData.co2Level > parameterConfig.co2Level.warningThreshold ? 'CO2浓度偏高' : 'CO2浓度正常'
        }
      ];
      setNotifications(newNotifications);
    }
  }, [sensorData]);

  return (
    <NotificationContainer collapsed={collapsed}>
      <CollapseButton 
        collapsed={collapsed}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <DoubleLeftOutlined /> : <DoubleRightOutlined />}
      </CollapseButton>
      <StyledCard title="实时状态监控" size="small" bordered={false}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {notifications.map((item, index) => (
            <NotificationItem key={index}>
              <StatusIcon status={item.status}>
                {getStatusIcon(item.status)}
              </StatusIcon>
              <Space direction="vertical" style={{ flex: 1 }}>
                <Space align="center">
                  <StatusBadge status={item.status as any} text={item.parameter} />
                  <Text style={{ color: getStatusColor(item.status) }}>
                    {item.value.toFixed(1)} {item.unit}
                  </Text>
                </Space>
                <Text type={item.status === 'success' ? 'secondary' : 'danger'} style={{ fontSize: '13px' }}>
                  {item.message}
                </Text>
              </Space>
            </NotificationItem>
          ))}
        </Space>
      </StyledCard>
    </NotificationContainer>
  );
};

export default NotificationPanel; 