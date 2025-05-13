import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Alert, Spin, Divider, Progress, Tooltip } from 'antd';
import { Line } from '@ant-design/plots';
import styled from 'styled-components';
import dayjs from 'dayjs';
import {
  BarChartOutlined,
  CloudOutlined,
  ExperimentOutlined,
  BulbOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { getSensorDataInTimeRange } from '../services/db';
import { useSensorData } from '../contexts/SensorDataContext';
import type { SensorData } from '../contexts/SensorDataContext';
import WeatherPanel from '../components/WeatherPanel';

const { Title, Text } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .ant-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 24px;
    padding-bottom: 16px;
  }
`;

const ChartContainer = styled.div`
  flex: 1;
  height: 180px;
  margin-top: 16px;
`;

const HeaderContainer = styled.div`
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  higherIsBetter?: boolean;
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

const StatusIcon = ({ value, warning, error }: { value: number, warning: number, error: number }) => {
  if (value >= error) {
    return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
  } else if (value >= warning) {
    return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
  } else {
    return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  }
};

const StatusText = ({ value, warning, error, higherIsBetter = false }: { 
  value: number, 
  warning: number, 
  error: number,
  higherIsBetter?: boolean 
}) => {
  if ((higherIsBetter && value <= error) || (!higherIsBetter && value >= error)) {
    return <Text type="danger">异常</Text>;
  } else if ((higherIsBetter && value <= warning) || (!higherIsBetter && value >= warning)) {
    return <Text type="warning">注意</Text>;
  } else {
    return <Text type="success">正常</Text>;
  }
};

const DifferenceIndicator = ({ 
  current, 
  reference, 
  label, 
  higherIsBetter 
}: { 
  current: number, 
  reference: number, 
  label: string,
  higherIsBetter?: boolean 
}) => {
  const diff = current - reference;
  const percentage = Math.abs((diff / reference) * 100).toFixed(1);
  
  // 差异小于 5% 时不显示
  if (Math.abs(diff) < reference * 0.05) {
    return null;
  }
  
  const isPositive = (diff > 0 && higherIsBetter) || (diff < 0 && !higherIsBetter);
  
  return (
    <div>
      <Text type={isPositive ? "success" : "danger"}>
        {diff > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        {' '}与{label}相比 {percentage}%
      </Text>
    </div>
  );
};

const ParameterLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(0,0,0,0.45);
  margin-bottom: 4px;
  height: 16px;
`;

const ParameterValueInfo = styled.div`
  display: flex;
  justify-content: center;
  font-size: 11px;
  margin-top: 4px;
  height: 16px;
`;

const StatusContainer = styled.div`
  height: 22px;
  margin-top: 6px;
  display: flex;
  align-items: center;
`;

const ProgressContainer = styled.div`
  margin: 12px 0;
`;

const DataSourceTagContainer = styled.div`
  margin-top: auto;
  padding-top: 8px;
`;

const ComparisonContainer = styled.div`
  height: 22px;
  margin-top: 8px;
  display: flex;
  align-items: center;
`;

const TargetProgress = ({ current, target, warningThreshold, color }: { 
  current: number, 
  target: number,
  warningThreshold: number,
  color: string
}) => {
  // 计算接近目标值的百分比
  const diff = Math.abs(current - target);
  const maxDiff = Math.abs(warningThreshold - target);
  const percentage = Math.max(0, 100 - (diff / maxDiff) * 100);
  
  // 确定进度条的颜色和状态
  let progressStatus: "success" | "normal" | "exception" | "active" | undefined = "normal";
  let progressColor = color;
  
  // 如果在目标值10%范围内，视为成功
  const closeToTarget = diff <= maxDiff * 0.1;
  if (closeToTarget) {
    progressStatus = "success";
  } else if (diff >= maxDiff * 0.8) {
    // 如果远离目标值，显示警告色
    progressStatus = "exception";
    progressColor = "#ff4d4f";
  }
  
  // 确定下限和上限
  const lowerBound = Math.min(target, warningThreshold);
  const upperBound = Math.max(target, warningThreshold);
  
  return (
    <ProgressContainer>
      <ParameterLabel>
        <span>{lowerBound}</span>
        <span>目标值: {target}</span>
        <span>{upperBound}</span>
      </ParameterLabel>
      <Progress 
        percent={percentage} 
        strokeColor={progressColor}
        status={progressStatus}
        size="small"
        showInfo={false}
      />
      <ParameterValueInfo>
        <Tooltip title={current > target ? "当前值高于目标值" : "当前值低于目标值"}>
          <span style={{ color: closeToTarget ? '#52c41a' : 'rgba(0,0,0,0.65)' }}>
            当前值: {current.toFixed(1)} {current > target ? '↑' : '↓'}
          </span>
        </Tooltip>
      </ParameterValueInfo>
    </ProgressContainer>
  );
};

const DataSourceTag = styled.div`
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.45);
  margin-top: 8px;
`;

const AnalysisCard = styled(Card)`
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const SectionTitle = styled.div`
  margin: 24px 0 16px;
  display: flex;
  align-items: center;
  
  .icon {
    font-size: 22px;
    margin-right: 12px;
    color: #1890ff;
  }
  
  h4 {
    margin: 0;
  }
`;

const Dashboard: React.FC = () => {
  const { sensorData, isLoading, error, isWeatherDriven } = useSensorData();
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

  const renderStatisticCard = (paramKey: string) => {
    if (!sensorData) return null;
    
    const config = parameterConfig[paramKey];
    const value = sensorData[paramKey as keyof typeof sensorData] as number;
    
    // 确定数据来源标签
    let dataSource = "实时传感器";
    let dataSourceIcon = <ExperimentOutlined />;
    let dataSourceTooltip = "从实际传感器获取的实时数据";
    
    if (isWeatherDriven) {
      if (paramKey === 'airTemperature') {
        dataSource = "天气数据调整";
        dataSourceIcon = <CloudOutlined />;
        dataSourceTooltip = "基于室外天气温度数据，结合大棚保温性能、阳光辐射效应和控制系统影响计算得出。温度受阳光照射、通风系统和加热/制冷系统共同影响。";
      } else if (paramKey === 'airHumidity') {
        dataSource = "天气数据调整";
        dataSourceIcon = <CloudOutlined />;
        dataSourceTooltip = "基于室外湿度数据，结合降水情况、大棚密封性和湿度控制系统计算得出。湿度受通风系统、加湿/除湿系统和温度变化共同影响。";
      } else if (paramKey === 'lightIntensity') {
        dataSource = "天气光照模型";
        dataSourceIcon = <BulbOutlined />;
        dataSourceTooltip = "基于当前时间、天气状况（云量）、大棚透光率和补光系统功率综合计算。白天主要受自然光影响，夜间完全依赖补光系统。";
      } else if (paramKey === 'co2Level') {
        dataSource = "通风与植物模型";
        dataSourceIcon = <ExperimentOutlined />;
        dataSourceTooltip = "基于植物光合作用模型（消耗CO2）、通风系统（引入室外CO2）和CO2注入系统共同作用的结果。光照越强，植物消耗CO2越多。";
      } else if (paramKey === 'soilMoisture') {
        dataSource = "灌溉与降水模型";
        dataSourceIcon = <ExperimentOutlined />;
        dataSourceTooltip = "基于灌溉系统运行状态、降水渗透（如果大棚不完全密闭）和土壤自然蒸发计算得出。土壤湿度变化相对较慢。";
      } else if (paramKey === 'soilTemperature') {
        dataSource = "热传导模型";
        dataSourceIcon = <ExperimentOutlined />;
        dataSourceTooltip = "基于室内空气温度和室外地温，通过热传导模型计算。土壤温度变化比空气温度慢，具有自然缓冲效应。";
      } else if (paramKey === 'soilPH') {
        dataSource = "土壤化学模型";
        dataSourceIcon = <ExperimentOutlined />;
        dataSourceTooltip = "基于初始土壤pH值，结合灌溉水质特性和施肥情况的长期模拟。pH值变化通常较为缓慢，除非有专门的调节措施。";
      } else if (paramKey === 'ec') {
        dataSource = "养分浓度模型";
        dataSourceIcon = <ExperimentOutlined />;
        dataSourceTooltip = "电导率(EC)表示土壤中可溶性盐分浓度，基于灌溉施肥系统运行状态和植物吸收模型计算。值越高表示养分浓度越高。";
      }
    } else {
      dataSource = "模拟数据";
      dataSourceTooltip = "使用三角函数和随机波动生成的模拟数据，不基于真实天气条件。主要用于系统演示和测试。";
    }
    
    // 计算比较数据
    let comparisonElement = null;
    if (isWeatherDriven) {
      if (paramKey === 'airTemperature' && sensorData.outdoorTemperature) {
        comparisonElement = (
          <DifferenceIndicator 
            current={value} 
            reference={sensorData.outdoorTemperature} 
            label="室外" 
          />
        );
      } else if (paramKey === 'airHumidity' && sensorData.outdoorHumidity) {
        comparisonElement = (
          <DifferenceIndicator 
            current={value} 
            reference={sensorData.outdoorHumidity} 
            label="室外" 
          />
        );
      }
    }

    return (
      <Col xs={24} sm={12} lg={6} key={paramKey}>
        <StyledCard>
          <Statistic
            title={
              <span>
                {config.icon} {config.name}
                <span style={{ float: 'right' }}>
                  <StatusIcon 
                    value={value} 
                    warning={config.warningThreshold} 
                    error={config.errorThreshold} 
                  />
                </span>
              </span>
            }
            value={value}
            precision={2}
            valueStyle={{ color: config.color }}
            suffix={config.unit}
          />
          <StatusContainer>
            <StatusText 
              value={value} 
              warning={config.warningThreshold} 
              error={config.errorThreshold}
              higherIsBetter={config.higherIsBetter}
            />
          </StatusContainer>
          
          <TargetProgress 
            current={value} 
            target={config.target}
            warningThreshold={config.warningThreshold}
            color={config.color}
          />

          <ComparisonContainer>
            {comparisonElement || <div style={{ height: '22px' }}></div>}
          </ComparisonContainer>
          
          <DataSourceTagContainer>
            <Tooltip title={dataSourceTooltip} placement="bottom">
              <DataSourceTag>
                {dataSourceIcon} 数据来源: {dataSource}
              </DataSourceTag>
            </Tooltip>
          </DataSourceTagContainer>
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
          <Row gutter={[16, 16]}>
            <Col xs={24}>
          <HeaderContainer>
            <Title level={2}>实时环境监测</Title>
          </HeaderContainer>
            </Col>
            
            <Col xs={24} md={12}>
              <WeatherPanel />
            </Col>
            
            <Col xs={24} md={12}>
              {isWeatherDriven && sensorData?.weather && (
                <AnalysisCard title={
                  <span>
                    <CloudOutlined /> 天气-环境影响分析
                  </span>
                }>
                  <Text>
                    当前天气「{sensorData.weather}」对大棚环境的主要影响：
                  </Text>
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  {sensorData.weather === '晴天' && (
                    <Text>
                      晴天光照充足，光合作用增强，但室内温度可能升高，需加强通风。外界温度较室内高{(sensorData.airTemperature - (sensorData.outdoorTemperature || 0)).toFixed(1)}°C。
                    </Text>
                  )}
                  
                  {sensorData.weather === '多云' && (
                    <Text>
                      多云天气光照不稳定，室内温度波动较小。外界温度较室内{(sensorData.airTemperature > (sensorData.outdoorTemperature || 0)) ? '低' : '高'}{Math.abs(sensorData.airTemperature - (sensorData.outdoorTemperature || 0)).toFixed(1)}°C。
                    </Text>
                  )}
                  
                  {sensorData.weather === '阴天' && (
                    <Text>
                      阴天光照不足，可能需要补光。外界湿度较高，温度较低，通风需谨慎。
                    </Text>
                  )}
                  
                  {(sensorData.weather === '小雨' || sensorData.weather === '中雨' || sensorData.weather === '大雨') && (
                    <Text>
                      雨天环境湿度高，光照强度低，室内需控制湿度，并考虑补光。降水量{sensorData.precipitation}mm/h，需注意排水。
                    </Text>
                  )}
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    注：此分析基于模拟天气数据和环境物理模型生成，仅供参考。
                  </Text>
                  
                  <div style={{ marginTop: 8 }}>
                    <Tooltip title="该分析由智能环境影响评估引擎生成，综合考虑当前天气状况、大棚物理特性和环境控制系统状态，预测天气变化对大棚内环境的潜在影响。">
                      <DataSourceTag>
                        <InfoCircleOutlined /> 数据来源: 环境影响分析模型
                      </DataSourceTag>
                    </Tooltip>
                  </div>
                </AnalysisCard>
              )}
            </Col>
            
            <Col xs={24}>
              <SectionTitle>
                <span className="icon"><BarChartOutlined /></span>
                <Title level={4}>环境参数监测</Title>
              </SectionTitle>
          <Row gutter={[16, 16]}>
            {renderStatisticCard('airTemperature')}
            {renderStatisticCard('airHumidity')}
            {renderStatisticCard('co2Level')}
            {renderStatisticCard('lightIntensity')}
            {renderStatisticCard('soilTemperature')}
            {renderStatisticCard('soilMoisture')}
            {renderStatisticCard('soilPH')}
            {renderStatisticCard('ec')}
              </Row>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 