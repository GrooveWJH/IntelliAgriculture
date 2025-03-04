import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Select, Row, Col, Table, Typography, Alert } from 'antd';
import { Line } from '@ant-design/plots';
import styled from 'styled-components';
import dayjs, { Dayjs } from 'dayjs';
import { parameterConfig } from './Dashboard';
import { getLatestSensorData, getWarningLogs } from '../services/db';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Paragraph, Text } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
`;

const parameterRelations = {
  airTemperature: {
    affects: ['airHumidity', 'soilTemperature'],
    controlMethods: ['通风系统', '遮阳系统'],
    description: '空气温度是影响植物生长的关键因素。过高的温度会导致植物蒸腾过度，影响生长；过低的温度会抑制植物的新陈代谢。',
  },
  airHumidity: {
    affects: ['soilMoisture'],
    controlMethods: ['加湿系统', '通风系统'],
    description: '空气湿度影响植物的蒸腾作用。过高的湿度可能导致病害滋生；过低的湿度会导致植物水分流失过快。',
  },
  soilMoisture: {
    affects: ['ec', 'soilTemperature'],
    controlMethods: ['灌溉系统', '排水系统'],
    description: '土壤水分直接影响植物根系的吸水和养分吸收。保持适宜的土壤湿度对植物生长至关重要。',
  },
  soilTemperature: {
    affects: ['soilMoisture', 'ec'],
    controlMethods: ['土壤加热系统', '遮阳系统'],
    description: '土壤温度影响根系活动和养分吸收。温度过高或过低都会影响植物生长。',
  },
  co2Level: {
    affects: [],
    controlMethods: ['CO2补充系统', '通风系统'],
    description: 'CO2是植物光合作用的原料。适当的CO2浓度可以提高植物的光合效率。',
  },
  lightIntensity: {
    affects: ['airTemperature', 'soilTemperature'],
    controlMethods: ['补光系统', '遮阳系统'],
    description: '光照强度直接影响植物的光合作用。不同生长阶段的植物对光照强度的需求不同。',
  },
  soilPH: {
    affects: ['ec'],
    controlMethods: ['pH调节系统'],
    description: '土壤pH值影响养分的有效性和微生物活动。不同植物对pH值的适应范围不同。',
  },
  ec: {
    affects: [],
    controlMethods: ['施肥系统', '冲洗系统'],
    description: '电导率(EC)反映了土壤中可溶性盐的含量，直接影响植物的养分吸收。',
  },
} as const;

const DataAnalysis: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(24, 'hour'),
    dayjs()
  ]);
  const [selectedParameter, setSelectedParameter] = useState<string>('airTemperature');
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [warningLogs, setWarningLogs] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const timeRange = dateRange[1].valueOf() - dateRange[0].valueOf();
      const sensorData = await getLatestSensorData(timeRange);
      setHistoricalData(sensorData);
      
      const warnings = await getWarningLogs(timeRange);
      setWarningLogs(warnings);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const config = {
    data: historicalData,
    padding: [20, 20, 50, 40],
    xField: 'timestamp',
    yField: selectedParameter,
    smooth: false,
    animation: false,
    autoFit: true,
    color: parameterConfig[selectedParameter].color,
    xAxis: {
      type: 'time',
      tickCount: 8,
      label: {
        formatter: (text: string) => dayjs(Number(text)).format('HH:mm')
      },
      title: {
        text: '时间',
      },
    },
    yAxis: {
      title: {
        text: `${parameterConfig[selectedParameter].name} (${parameterConfig[selectedParameter].unit || ''})`,
      },
      label: {
        formatter: (v: string) => `${Number(v).toFixed(1)}${parameterConfig[selectedParameter].unit || ''}`,
      },
    },
    tooltip: {
      formatter: (data: any) => {
        return {
          name: parameterConfig[selectedParameter].name,
          value: `${Number(data[selectedParameter]).toFixed(1)}${parameterConfig[selectedParameter].unit || ''}`,
          time: dayjs(data.timestamp).format('YYYY-MM-DD HH:mm:ss'),
        };
      },
    },
    point: {
      size: 3,
      shape: 'circle',
      style: {
        stroke: '#fff',
        lineWidth: 1,
      },
    },
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

  const warningColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '参数',
      dataIndex: 'parameter',
      key: 'parameter',
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      render: (value: number, record: any) => 
        `${value} ${parameterConfig[record.parameter]?.unit || ''}`,
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => (
        <Text type={level === 'error' ? 'danger' : 'warning'}>{level}</Text>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>数据分析</Title>
      
      <StyledCard title="参数说明">
        <Paragraph>
          <Text strong>当前选中参数：</Text>
          {parameterConfig[selectedParameter].name}
        </Paragraph>
        <Paragraph>
          <Text strong>参数描述：</Text>
          {parameterRelations[selectedParameter as keyof typeof parameterRelations].description}
        </Paragraph>
        <Paragraph>
          <Text strong>影响的参数：</Text>
          {parameterRelations[selectedParameter as keyof typeof parameterRelations].affects.map(
            param => parameterConfig[param].name
          ).join('、') || '无直接影响'}
        </Paragraph>
        <Paragraph>
          <Text strong>控制方式：</Text>
          {parameterRelations[selectedParameter as keyof typeof parameterRelations].controlMethods.join('、')}
        </Paragraph>
        <Alert
          message="参数阈值说明"
          description={`警告阈值：${parameterConfig[selectedParameter].warningThreshold} ${parameterConfig[selectedParameter].unit || ''}
            错误阈值：${parameterConfig[selectedParameter].errorThreshold} ${parameterConfig[selectedParameter].unit || ''}`}
          type="info"
          showIcon
        />
      </StyledCard>

      <Row gutter={16}>
        <Col span={24}>
          <StyledCard>
            <div style={{ marginBottom: 16 }}>
              <Select
                value={selectedParameter}
                onChange={setSelectedParameter}
                style={{ width: 120, marginRight: 16 }}
              >
                {Object.entries(parameterConfig).map(([key, { name }]) => (
                  <Option key={key} value={key}>{name}</Option>
                ))}
              </Select>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  if (dates) {
                    setDateRange([dates[0]!, dates[1]!]);
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
            <Title level={4}>平均值</Title>
            <Text>{stats.avg} {parameterConfig[selectedParameter].unit || ''}</Text>
          </StyledCard>
        </Col>
        <Col span={8}>
          <StyledCard>
            <Title level={4}>最大值</Title>
            <Text>{stats.max} {parameterConfig[selectedParameter].unit || ''}</Text>
          </StyledCard>
        </Col>
        <Col span={8}>
          <StyledCard>
            <Title level={4}>最小值</Title>
            <Text>{stats.min} {parameterConfig[selectedParameter].unit || ''}</Text>
          </StyledCard>
        </Col>
      </Row>

      <StyledCard title="警告记录">
        <Table
          dataSource={warningLogs}
          columns={warningColumns}
          rowKey="timestamp"
          pagination={{ pageSize: 10 }}
        />
      </StyledCard>
    </div>
  );
};

export default DataAnalysis; 