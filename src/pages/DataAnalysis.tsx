import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Select, Row, Col } from 'antd';
import { Line } from '@ant-design/plots';
import styled from 'styled-components';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
`;

const generateHistoricalData = (days: number) => {
  const data = [];
  const now = dayjs();
  
  for (let i = 0; i < days * 24; i++) {
    const time = now.subtract((days * 24 - i) * 3600, 'second');
    data.push({
      time: time.toISOString(),
      temperature: 20 + Math.sin(i / 12) * 5 + Math.random() * 2,
      humidity: 60 + Math.sin(i / 12) * 10 + Math.random() * 5,
      co2: 400 + Math.sin(i / 12) * 100 + Math.random() * 50,
      light: 2000 + Math.sin(i / 12) * 500 + Math.random() * 200,
    });
  }
  
  return data;
};

const DataAnalysis: React.FC = () => {
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [selectedParameter, setSelectedParameter] = useState<string>('temperature');
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);

  useEffect(() => {
    // 模拟加载历史数据
    const days = Math.ceil(timeRange[1].diff(timeRange[0], 'day', true));
    setHistoricalData(generateHistoricalData(days));
  }, [timeRange]);

  const parameters = {
    temperature: { name: '温度', unit: '°C' },
    humidity: { name: '湿度', unit: '%' },
    co2: { name: 'CO2浓度', unit: 'ppm' },
    light: { name: '光照', unit: 'lux' },
  };

  const config = {
    data: historicalData,
    xField: 'time',
    yField: selectedParameter,
    seriesField: 'type',
    xAxis: {
      type: 'time',
      title: {
        text: '时间',
      },
    },
    yAxis: {
      title: {
        text: `${parameters[selectedParameter as keyof typeof parameters].name} (${parameters[selectedParameter as keyof typeof parameters].unit})`,
      },
    },
    smooth: true,
  };

  const calculateStatistics = () => {
    if (historicalData.length === 0) return { avg: 0, max: 0, min: 0 };
    
    const values = historicalData.map(item => item[selectedParameter]);
    return {
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      max: Math.max(...values).toFixed(2),
      min: Math.min(...values).toFixed(2),
    };
  };

  const stats = calculateStatistics();

  return (
    <div>
      <h2>数据分析</h2>
      <Row gutter={16}>
        <Col span={24}>
          <StyledCard>
            <div style={{ marginBottom: 16 }}>
              <Select
                value={selectedParameter}
                onChange={setSelectedParameter}
                style={{ width: 120, marginRight: 16 }}
              >
                {Object.entries(parameters).map(([key, { name }]) => (
                  <Option key={key} value={key}>{name}</Option>
                ))}
              </Select>
              <RangePicker
                value={timeRange}
                onChange={(dates) => {
                  if (dates) {
                    setTimeRange([dates[0]!, dates[1]!]);
                  }
                }}
              />
            </div>
            <Line {...config} />
          </StyledCard>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={8}>
          <StyledCard>
            <h3>平均值</h3>
            <p>{stats.avg} {parameters[selectedParameter as keyof typeof parameters].unit}</p>
          </StyledCard>
        </Col>
        <Col span={8}>
          <StyledCard>
            <h3>最大值</h3>
            <p>{stats.max} {parameters[selectedParameter as keyof typeof parameters].unit}</p>
          </StyledCard>
        </Col>
        <Col span={8}>
          <StyledCard>
            <h3>最小值</h3>
            <p>{stats.min} {parameters[selectedParameter as keyof typeof parameters].unit}</p>
          </StyledCard>
        </Col>
      </Row>
    </div>
  );
};

export default DataAnalysis; 