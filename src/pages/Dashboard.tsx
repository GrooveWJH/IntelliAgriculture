import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Alert, Spin } from 'antd';
import { Line } from '@ant-design/plots';
import styled from 'styled-components';
import dayjs from 'dayjs';
import {
  BarChartOutlined,
  CloudOutlined,
  ExperimentOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { getSensorDataInTimeRange } from '../services/db';
import { useSensorData } from '../contexts/SensorDataContext';
import type { SensorData } from '../contexts/SensorDataContext';

const { Title } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;

  .ant-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 24px;
  }
`;

const ChartContainer = styled.div`
  flex: 1;
  height: 180px;
  margin-top: 16px;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .ant-typography {
    font-size: 28px;
    font-weight: 600;
  }
`;

const StyledStatistic = styled(Statistic)`
  .ant-statistic-title {
    font-size: 16px;
    margin-bottom: 8px;
    color: rgba(0, 0, 0, 0.85);
  }
  
  .ant-statistic-content {
    font-size: 24px;
    font-weight: 500;
  }
`;

const formatNumber = (value: number) => {
  return Number(value.toFixed(2));
};

interface ParameterConfig {
  name: string;
  unit?: string;
  warningThreshold: number;
  errorThreshold: number;
  icon: React.ReactNode;
  color: string;
  target: number;
}

export const parameterConfig: Record<string, ParameterConfig> = {
  airTemperature: {
    name: '空气温度',
    unit: '°C',
    warningThreshold: 25,
    errorThreshold: 28,
    icon: <BarChartOutlined />,
    color: '#ff4d4f',
    target: 22
  },
  airHumidity: {
    name: '空气湿度',
    unit: '%',
    warningThreshold: 70,
    errorThreshold: 75,
    icon: <CloudOutlined />,
    color: '#1890ff',
    target: 65
  },
  soilMoisture: {
    name: '土壤湿度',
    unit: '%',
    warningThreshold: 80,
    errorThreshold: 85,
    icon: <CloudOutlined />,
    color: '#52c41a',
    target: 75
  },
  soilTemperature: {
    name: '土壤温度',
    unit: '°C',
    warningThreshold: 22,
    errorThreshold: 25,
    icon: <BarChartOutlined />,
    color: '#faad14',
    target: 20
  },
  co2Level: {
    name: 'CO2浓度',
    unit: 'ppm',
    warningThreshold: 800,
    errorThreshold: 1000,
    icon: <ExperimentOutlined />,
    color: '#722ed1',
    target: 600
  },
  lightIntensity: {
    name: '光照强度',
    unit: 'lux',
    warningThreshold: 2500,
    errorThreshold: 3000,
    icon: <BulbOutlined />,
    color: '#eb2f96',
    target: 2000
  },
  soilPH: {
    name: '土壤pH值',
    warningThreshold: 7.5,
    errorThreshold: 8,
    icon: <ExperimentOutlined />,
    color: '#13c2c2',
    target: 7.0
  },
  ec: {
    name: '电导率(EC)',
    unit: 'mS/cm',
    warningThreshold: 1.5,
    errorThreshold: 1.8,
    icon: <ExperimentOutlined />,
    color: '#fa8c16',
    target: 1.3
  },
};

const renderChart = (parameter: keyof Omit<SensorData, 'timestamp'>, historicalData: SensorData[]) => {
  const values = historicalData.map(item => Number(item[parameter]));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  const yMin = minValue * 0.9;
  const yMax = maxValue * 1.1;

  const now = Date.now();
  const fifteenSecondsAgo = now - 15 * 1000;

  const config = {
    data: historicalData,
    padding: [10, 20, 30, 40],
    xField: 'timestamp',
    yField: parameter,
    smooth: false,
    animation: false,
    autoFit: true,
    color: parameterConfig[parameter].color,
    xAxis: {
      type: 'time' as const,
      tickCount: 5,
      range: [0, 1],
      min: fifteenSecondsAgo,
      max: now,
      label: null,
      grid: {
        line: {
          style: {
            stroke: 'rgba(0,0,0,0.05)',
            lineWidth: 1,
          },
        },
      },
    },
    yAxis: {
      min: yMin,
      max: yMax,
      label: {
        formatter: (v: string) => `${Number(v).toFixed(1)}${parameterConfig[parameter].unit || ''}`,
      },
      grid: {
        line: {
          style: {
            stroke: 'rgba(0,0,0,0.05)',
            lineWidth: 1,
          },
        },
      },
    },
    tooltip: {
      formatter: (data: any) => {
        return {
          name: parameterConfig[parameter].name,
          value: `${Number(data[parameter]).toFixed(1)}${parameterConfig[parameter].unit || ''}`,
          time: dayjs(data.timestamp).format('HH:mm:ss'),
        };
      },
    },
    meta: {
      timestamp: {
        range: [0, 1],
      },
    },
  };

  return (
    <ChartContainer>
      <Line {...config} />
    </ChartContainer>
  );
};

const Dashboard: React.FC = () => {
  const { sensorData, isLoading, error } = useSensorData();
  const [historicalData, setHistoricalData] = useState<SensorData[]>([]);

  // 加载历史数据
  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        const endTime = Date.now();
        const startTime = endTime - 15 * 1000; // 15秒前的数据
        const data = await getSensorDataInTimeRange(startTime, endTime);
        if (data && data.length > 0) {
          setHistoricalData(data);
        }
      } catch (error) {
        console.error('Failed to load historical data:', error);
      }
    };
    loadHistoricalData();
  }, []);

  // 更新历史数据
  useEffect(() => {
    if (sensorData) {
      const fifteenSecondsAgo = Date.now() - 15 * 1000;
      setHistoricalData(prev => {
        // 保留最近15秒的数据
        const recentData = prev.filter(item => item.timestamp > fifteenSecondsAgo);
        // 如果数据点超过15个，只保留最新的15个
        const limitedData = [...recentData, sensorData].slice(-15);
        return limitedData;
      });
    }
  }, [sensorData]);

  const renderStatisticCard = (parameter: keyof Omit<SensorData, 'timestamp'>) => {
    const config = parameterConfig[parameter];
    const value = sensorData?.[parameter] ?? 0;
    const status = value >= config.errorThreshold ? 'error' : 
                  value >= config.warningThreshold ? 'warning' : 'normal';

    return (
      <Col xs={24} sm={12} lg={6} style={{ marginBottom: 16 }}>
        <StyledCard>
          <StyledStatistic
            title={config.name}
            value={value}
            precision={1}
            suffix={config.unit}
            prefix={config.icon}
            valueStyle={{ 
              color: status === 'error' ? '#f5222d' : 
                     status === 'warning' ? '#faad14' : 
                     'var(--text-primary)',
              fontSize: '24px'
            }}
          />
          {renderChart(parameter, historicalData)}
        </StyledCard>
      </Col>
    );
  };

  return (
    <div>
      {error && (
        <Alert
          message="数据获取错误"
          description={error.message}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>加载传感器数据...</div>
        </div>
      ) : (
        <div>
          <HeaderContainer>
            <Title level={2}>实时环境监测</Title>
          </HeaderContainer>
          <Row gutter={[16, 16]}>
            {renderStatisticCard('airTemperature')}
            {renderStatisticCard('airHumidity')}
            {renderStatisticCard('co2Level')}
            {renderStatisticCard('lightIntensity')}
          </Row>
          <Row gutter={[16, 16]}>
            {renderStatisticCard('soilTemperature')}
            {renderStatisticCard('soilMoisture')}
            {renderStatisticCard('soilPH')}
            {renderStatisticCard('ec')}
          </Row>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 