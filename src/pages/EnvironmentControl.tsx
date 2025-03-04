import React, { useState } from 'react';
import { Card, Switch, Slider, Row, Col, Typography } from 'antd';
import styled from 'styled-components';
import {
  ThunderboltOutlined,
  CloudOutlined,
  BulbOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
`;

const ControlItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  
  .icon {
    font-size: 24px;
    margin-right: 16px;
  }
  
  .control-label {
    flex: 1;
  }
  
  .control-value {
    width: 200px;
    margin-left: 16px;
  }
`;

interface ControlDevice {
  name: string;
  icon: React.ReactNode;
  status: boolean;
  value?: number;
  unit?: string;
}

const EnvironmentControl: React.FC = () => {
  const [devices, setDevices] = useState<ControlDevice[]>([
    {
      name: '通风系统',
      icon: <ThunderboltOutlined />,
      status: false,
      value: 50,
      unit: '%',
    },
    {
      name: '灌溉系统',
      icon: <CloudOutlined />,
      status: false,
      value: 0,
      unit: 'L/min',
    },
    {
      name: '补光系统',
      icon: <BulbOutlined />,
      status: false,
      value: 60,
      unit: '%',
    },
    {
      name: '施肥系统',
      icon: <ExperimentOutlined />,
      status: false,
      value: 0,
      unit: 'mL/min',
    },
  ]);

  const handleStatusChange = (index: number, checked: boolean) => {
    const newDevices = [...devices];
    newDevices[index].status = checked;
    setDevices(newDevices);
  };

  const handleValueChange = (index: number, value: number) => {
    const newDevices = [...devices];
    newDevices[index].value = value;
    setDevices(newDevices);
  };

  return (
    <div>
      <Title level={2}>环境控制</Title>
      <Row gutter={16}>
        <Col span={12}>
          <StyledCard title="设备控制">
            {devices.map((device, index) => (
              <ControlItem key={device.name}>
                <span className="icon">{device.icon}</span>
                <span className="control-label">{device.name}</span>
                <div className="control-value">
                  <Switch
                    checked={device.status}
                    onChange={(checked) => handleStatusChange(index, checked)}
                  />
                  {device.value !== undefined && (
                    <Slider
                      value={device.value}
                      onChange={(value) => handleValueChange(index, value)}
                      disabled={!device.status}
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>
                {device.unit && <span style={{ marginLeft: 8 }}>{device.value}{device.unit}</span>}
              </ControlItem>
            ))}
          </StyledCard>
        </Col>
        <Col span={12}>
          <StyledCard title="运行状态">
            {devices.map((device) => (
              <div key={device.name} style={{ marginBottom: 16 }}>
                <Title level={5}>{device.name}</Title>
                <p>
                  状态: {device.status ? '运行中' : '已停止'}
                  {device.status && device.value !== undefined && (
                    <span style={{ marginLeft: 16 }}>
                      运行参数: {device.value}{device.unit}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </StyledCard>
        </Col>
      </Row>
    </div>
  );
};

export default EnvironmentControl; 