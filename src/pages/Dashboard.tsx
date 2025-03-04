import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { Line } from '@ant-design/plots';
import styled from 'styled-components';
import {
  // TODO: 需要替换为合适的温度计图标
  // 建议使用: 温度计相关图标
  BarChartOutlined,
  // 保留这个云图标用于表示湿度
  CloudOutlined,
  // TODO: 需要替换为合适的实验/化学图标
  // 建议使用: 实验室/化学相关图标
  ExperimentOutlined,
  // 保留这个灯泡图标用于表示光照
  BulbOutlined,
} from '@ant-design/icons';

const StyledCard = styled(Card)`
  margin-bottom: 24px;
`;

// 模拟传感器数据生成
const generateSensorData = () => {
  return {
    airTemperature: (20 + Math.random() * 10).toFixed(1),
    airHumidity: (60 + Math.random() * 20).toFixed(1),
    soilMoisture: (70 + Math.random() * 15).toFixed(1),
    soilTemperature: (18 + Math.random() * 8).toFixed(1),
    co2Level: (400 + Math.random() * 200).toFixed(0),
    lightIntensity: (2000 + Math.random() * 1000).toFixed(0),
    soilPH: (6.5 + Math.random()).toFixed(1),
    ec: (1.2 + Math.random() * 0.5).toFixed(2),
  };
};

const Dashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState(generateSensorData());
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    // 每5秒更新一次数据
    const timer = setInterval(() => {
      const newData = generateSensorData();
      setSensorData(newData);
      
      setHistoricalData(prev => {
        const now = new Date();
        const newPoint = {
          time: now.toLocaleTimeString(),
          temperature: Number(newData.airTemperature),
          humidity: Number(newData.airHumidity),
        };
        
        if (prev.length > 30) {
          return [...prev.slice(1), newPoint];
        }
        return [...prev, newPoint];
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const config = {
    data: historicalData,
    xField: 'time',
    yField: 'temperature',
    seriesField: 'type',
    smooth: true,
    animation: false,
  };

  return (
    <div>
      <h2>实时环境监测</h2>
      <Row gutter={16}>
        <Col span={6}>
          <StyledCard>
            <Statistic
              title="空气温度"
              value={sensorData.airTemperature}
              suffix="°C"
              prefix={<BarChartOutlined />}
            />
          </StyledCard>
        </Col>
        <Col span={6}>
          <StyledCard>
            <Statistic
              title="空气湿度"
              value={sensorData.airHumidity}
              suffix="%"
              prefix={<CloudOutlined />}
            />
          </StyledCard>
        </Col>
        <Col span={6}>
          <StyledCard>
            <Statistic
              title="CO2浓度"
              value={sensorData.co2Level}
              suffix="ppm"
              prefix={<ExperimentOutlined />}
            />
          </StyledCard>
        </Col>
        <Col span={6}>
          <StyledCard>
            <Statistic
              title="光照强度"
              value={sensorData.lightIntensity}
              suffix="lux"
              prefix={<BulbOutlined />}
            />
          </StyledCard>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <StyledCard>
            <Statistic
              title="土壤温度"
              value={sensorData.soilTemperature}
              suffix="°C"
              prefix={<BarChartOutlined />}
            />
          </StyledCard>
        </Col>
        <Col span={6}>
          <StyledCard>
            <Statistic
              title="土壤湿度"
              value={sensorData.soilMoisture}
              suffix="%"
              prefix={<CloudOutlined />}
            />
          </StyledCard>
        </Col>
        <Col span={6}>
          <StyledCard>
            <Statistic
              title="土壤pH值"
              value={sensorData.soilPH}
              prefix={<ExperimentOutlined />}
            />
          </StyledCard>
        </Col>
        <Col span={6}>
          <StyledCard>
            <Statistic
              title="电导率(EC)"
              value={sensorData.ec}
              suffix="mS/cm"
              prefix={<ExperimentOutlined />}
            />
          </StyledCard>
        </Col>
      </Row>

      <StyledCard title="温度趋势">
        <Line {...config} />
      </StyledCard>
    </div>
  );
};

export default Dashboard; 