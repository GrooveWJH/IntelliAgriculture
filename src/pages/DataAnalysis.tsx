import React, { useState, useEffect, useCallback } from 'react';
import { Card, DatePicker, Select, Row, Col, Table, Typography, Alert, Button, Spin } from 'antd';
import { Line } from '@ant-design/plots';
import styled from 'styled-components';
import dayjs, { Dayjs } from 'dayjs';
import { parameterConfig } from './Dashboard';
import { getSensorDataInTimeRange } from '../services/db';
import { useSensorData } from '../contexts/SensorDataContext';

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
  const { getHistoricalData } = useSensorData();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(1, 'hour'),
    dayjs()
  ]);
  const [selectedParameter, setSelectedParameter] = useState<string>('airTemperature');
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [warningLogs, setWarningLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const startTime = dateRange[0].valueOf();
      const endTime = dateRange[1].valueOf();
      
      const sensorData = getHistoricalData(startTime, endTime);
      
      const validatedData = sensorData.map(item => ({
        ...item,
        timestamp: typeof item.timestamp === 'number' ? item.timestamp : Number(item.timestamp)
      })).filter(item => !isNaN(item.timestamp));
      
      const sampledData = sampleData(validatedData, 200);
      setHistoricalData(sampledData);
      
      const warnings = generateMockWarnings(sampledData, selectedParameter);
      setWarningLogs(warnings);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
    }
  }, [dateRange, getHistoricalData, selectedParameter]);

  const sampleData = (data: any[], maxPoints: number) => {
    if (!data || data.length === 0) return [];
    
    if (data.length <= maxPoints) return data;
    
    const step = Math.ceil(data.length / maxPoints);
    const result = [];
    
    for (let i = 0; i < data.length; i += step) {
      if (data[i] && typeof data[i].timestamp !== 'undefined') {
        const item = {
          ...data[i],
          timestamp: typeof data[i].timestamp === 'number' ? data[i].timestamp : Number(data[i].timestamp)
        };
        
        if (!isNaN(item.timestamp)) {
          result.push(item);
        }
      }
    }
    
    return result;
  };

  const generateMockWarnings = (data: any[], parameter: string) => {
    const warnings: Array<{
      timestamp: number;
      parameter: string;
      value: number;
      threshold: number;
      message: string;
      level: string;
    }> = [];
    const config = parameterConfig[parameter];
    
    data.forEach(item => {
      if (item[parameter] > config.warningThreshold) {
        warnings.push({
          timestamp: item.timestamp,
          parameter: parameter,
          value: item[parameter],
          threshold: config.warningThreshold,
          message: `${config.name}超过警告阈值`,
          level: item[parameter] > config.errorThreshold ? 'error' : 'warning',
        });
      }
    });
    
    return warnings.slice(0, 10);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const now = dayjs();
    const isIncludingNow = dateRange[1].isAfter(now) || dateRange[1].isSame(now);
    
    if (isIncludingNow && refreshInterval === null) {
      const interval = window.setInterval(loadData, 10000);
      setRefreshInterval(interval);
    } else if (!isIncludingNow && refreshInterval !== null) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    
    return () => {
      if (refreshInterval !== null) {
        clearInterval(refreshInterval);
      }
    };
  }, [dateRange, loadData, refreshInterval]);

  const config = {
    data: historicalData,
    padding: [20, 20, 50, 40],
    xField: 'timestamp',
    yField: selectedParameter,
    smooth: true,
    animation: {
      appear: {
        duration: 500,
      },
    },
    autoFit: true,
    color: parameterConfig[selectedParameter].color,
    xAxis: {
      type: 'time',
      tickCount: 8,
      label: {
        formatter: (text: string) => {
          const timestamp = typeof text === 'string' ? parseInt(text, 10) : text;
          
          if (isNaN(timestamp)) {
            console.error('Invalid timestamp:', text);
            return '';
          }
          
          try {
            return dayjs(timestamp).format('HH:mm:ss');
          } catch (error) {
            console.error('Error formatting date:', error, timestamp);
            return '';
          }
        }
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
        const timestamp = data.timestamp ? data.timestamp : Date.now();
        return {
          name: parameterConfig[selectedParameter].name,
          value: `${Number(data[selectedParameter]).toFixed(1)}${parameterConfig[selectedParameter].unit || ''}`,
          time: dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'),
        };
      },
    },
    point: {
      size: 3,
      shape: 'circle',
      style: {
        stroke: '#fff',
        lineWidth: 1,
        fillOpacity: 1,
      },
    },
    line: {
      style: {
        lineWidth: 2,
      },
    },
    state: {
      active: {
        style: {
          shadowBlur: 4,
          stroke: '#000',
          fillOpacity: 0.8,
        },
      },
    },
    interactions: [
      {
        type: 'marker-active',
      },
    ],
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
      render: (timestamp: number) => {
        if (isNaN(timestamp)) return '';
        return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      title: '参数',
      dataIndex: 'parameter',
      key: 'parameter',
      render: (param: string) => parameterConfig[param]?.name || param,
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      render: (value: number, record: any) => 
        `${value.toFixed(2)} ${parameterConfig[record.parameter]?.unit || ''}`,
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
        <Text type={level === 'error' ? 'danger' : 'warning'}>{level === 'error' ? '错误' : '警告'}</Text>
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
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
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
                  showTime
                  style={{ marginRight: 16 }}
                />
                <Button type="primary" onClick={loadData} loading={isLoading}>刷新数据</Button>
              </div>
              <div>
                {refreshInterval !== null && (
                  <Text type="secondary">已启用自动刷新 (10秒)</Text>
                )}
              </div>
            </div>
            {isLoading ? (
              <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin tip="加载数据中..." />
              </div>
            ) : historicalData.length > 0 ? (
              <div style={{ height: 400 }}>
            <Line {...config} />
              </div>
            ) : (
              <Alert
                message="没有数据"
                description="所选时间范围内没有数据，请尝试调整时间范围或参数。"
                type="info"
                showIcon
              />
            )}
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

      <StyledCard 
        title="警告记录" 
        extra={warningLogs.length > 0 ? `共 ${warningLogs.length} 条记录` : null}
      >
        {warningLogs.length > 0 ? (
        <Table
          dataSource={warningLogs}
          columns={warningColumns}
          rowKey="timestamp"
            pagination={{ pageSize: 5 }}
        />
        ) : (
          <Alert
            message="没有警告记录"
            description="所选时间范围和参数没有触发警告阈值。"
            type="info"
            showIcon
          />
        )}
      </StyledCard>
    </div>
  );
};

export default DataAnalysis; 