import React from 'react';
import { Card, Typography, Row, Col, Statistic, Badge, Switch, Input, Button, Tooltip, Space } from 'antd';
import { 
  CloudOutlined, 
  ThunderboltOutlined, 
  CompassOutlined, 
  EnvironmentOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useSensorData } from '../contexts/SensorDataContext';

const { Title, Text } = Typography;
const { Search } = Input;

const WeatherCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.09);
  transition: all 0.3s ease;
  height: 100%;
  
  &:hover {
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const StatisticContainer = styled.div`
  padding: 12px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  margin-bottom: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
`;

const WeatherIcon = styled.div<{ type: string }>`
  font-size: 32px;
  margin-right: 16px;
  color: ${props => {
    switch (props.type) {
      case '晴天': return '#f1c40f';
      case '多云': return '#3498db';
      case '阴天': return '#7f8c8d';
      case '小雨': return '#2980b9';
      case '中雨': return '#2c3e50';
      case '大雨': return '#34495e';
      default: return '#3498db';
    }
  }};
`;

// 获取天气图标
const getWeatherIcon = (type?: string) => {
  if (!type) return <CloudOutlined />;
  
  switch (type) {
    case '晴天':
      return <span role="img" aria-label="晴天">☀️</span>;
    case '多云':
      return <span role="img" aria-label="多云">⛅</span>;
    case '阴天':
      return <span role="img" aria-label="阴天">☁️</span>;
    case '小雨':
      return <span role="img" aria-label="小雨">🌦️</span>;
    case '中雨':
      return <span role="img" aria-label="中雨">🌧️</span>;
    case '大雨':
      return <span role="img" aria-label="大雨">⛈️</span>;
    default:
      return <CloudOutlined />;
  }
};

const DataSourceInfo = styled.div`
  margin-top: 12px;
  padding: 8px;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.02);
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
`;

const WeatherPanel: React.FC = () => {
  const { 
    sensorData, 
    isWeatherDriven, 
    setWeatherDriven,
    weatherLocation,
    setWeatherLocation 
  } = useSensorData();

  // 处理位置搜索
  const handleLocationSearch = (value: string) => {
    if (value) {
      setWeatherLocation(value);
    }
  };

  // 处理模式切换
  const handleModeChange = (checked: boolean) => {
    setWeatherDriven(checked);
  };

  return (
    <WeatherCard title={
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          <CloudOutlined /> 天气信息
        </Title>
        <Tooltip title={isWeatherDriven ? "当前使用天气数据驱动模拟" : "当前使用基础三角函数模拟"}>
          <Switch
            checkedChildren="天气驱动"
            unCheckedChildren="基础模拟"
            checked={isWeatherDriven}
            onChange={handleModeChange}
          />
        </Tooltip>
      </div>
    }>
      {isWeatherDriven ? (
        <>
          <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <WeatherIcon type={sensorData?.weather || '多云'}>
                {getWeatherIcon(sensorData?.weather)}
              </WeatherIcon>
            </Col>
            <Col flex="auto">
              <Title level={4} style={{ margin: 0 }}>
                {sensorData?.weather || '未知天气'} {sensorData?.description && `- ${sensorData.description}`}
              </Title>
              <Text type="secondary">
                <EnvironmentOutlined /> 位置: {weatherLocation}
              </Text>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <StatisticContainer>
                <Statistic 
                  title="室外温度" 
                  value={sensorData?.outdoorTemperature || 0} 
                  suffix="°C"
                  precision={1}
                />
              </StatisticContainer>
            </Col>
            <Col span={12}>
              <StatisticContainer>
                <Statistic 
                  title="室外湿度" 
                  value={sensorData?.outdoorHumidity || 0} 
                  suffix="%"
                  precision={1}
                />
              </StatisticContainer>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <StatisticContainer>
                <Statistic 
                  title="降水量" 
                  value={sensorData?.precipitation || 0} 
                  suffix="mm/h"
                  precision={1}
                />
              </StatisticContainer>
            </Col>
            <Col span={12}>
              <StatisticContainer>
                <Statistic 
                  title="风速" 
                  value={sensorData?.windSpeed || 0} 
                  suffix="m/s"
                  precision={1}
                />
              </StatisticContainer>
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <Title level={5}>
              <CompassOutlined /> 位置设置
            </Title>
            <Search
              placeholder="输入经纬度，如：116.3883,39.9289"
              defaultValue={weatherLocation}
              enterButton="更新"
              onSearch={handleLocationSearch}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              <InfoCircleOutlined /> 格式：经度,纬度（如：116.3883,39.9289 表示北京）
            </Text>
          </div>
          
          <DataSourceInfo>
            <Tooltip title="系统默认使用模拟天气数据生成器，根据时间、季节、位置等因素计算合理的天气状况。当API密钥配置后，可连接真实天气数据服务。">
              <span><InfoCircleOutlined /> 数据来源：天气数据服务API（当前使用模拟数据）</span>
            </Tooltip>
          </DataSourceInfo>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Title level={4}>基础模拟模式</Title>
          <Text type="secondary">
            当前使用基于三角函数的基础模拟模式，没有真实天气数据。
            <br />
            切换到"天气驱动"模式以使用真实天气数据进行模拟。
          </Text>
          <div style={{ marginTop: 16 }}>
            <Button type="primary" onClick={() => setWeatherDriven(true)}>
              切换到天气驱动模式
            </Button>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: 16 }}>
        <Badge 
          status={isWeatherDriven ? "processing" : "default"} 
          text={
            <Text>
              <ThunderboltOutlined /> 模拟系统状态: {isWeatherDriven ? '天气数据驱动' : '基础三角函数模拟'}
            </Text>
          } 
        />
      </div>
    </WeatherCard>
  );
};

export default WeatherPanel; 