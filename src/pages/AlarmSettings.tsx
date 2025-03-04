import React, { useState } from 'react';
import { Card, Form, InputNumber, Switch, Table, Button, message } from 'antd';
import styled from 'styled-components';

const StyledCard = styled(Card)`
  margin-bottom: 24px;
`;

interface AlarmThreshold {
  key: string;
  parameter: string;
  min: number;
  max: number;
  unit: string;
  enabled: boolean;
}

const initialThresholds: AlarmThreshold[] = [
  {
    key: '1',
    parameter: '空气温度',
    min: 15,
    max: 30,
    unit: '°C',
    enabled: true,
  },
  {
    key: '2',
    parameter: '空气湿度',
    min: 40,
    max: 80,
    unit: '%',
    enabled: true,
  },
  {
    key: '3',
    parameter: 'CO2浓度',
    min: 350,
    max: 1000,
    unit: 'ppm',
    enabled: true,
  },
  {
    key: '4',
    parameter: '光照强度',
    min: 1000,
    max: 3000,
    unit: 'lux',
    enabled: true,
  },
  {
    key: '5',
    parameter: '土壤温度',
    min: 10,
    max: 25,
    unit: '°C',
    enabled: true,
  },
  {
    key: '6',
    parameter: '土壤湿度',
    min: 60,
    max: 85,
    unit: '%',
    enabled: true,
  },
  {
    key: '7',
    parameter: '土壤pH值',
    min: 5.5,
    max: 7.5,
    unit: '',
    enabled: true,
  },
  {
    key: '8',
    parameter: '电导率(EC)',
    min: 0.8,
    max: 1.8,
    unit: 'mS/cm',
    enabled: true,
  },
];

const AlarmSettings: React.FC = () => {
  const [thresholds, setThresholds] = useState<AlarmThreshold[]>(initialThresholds);
  const [form] = Form.useForm();

  const columns = [
    {
      title: '监测参数',
      dataIndex: 'parameter',
      key: 'parameter',
    },
    {
      title: '最小值',
      dataIndex: 'min',
      key: 'min',
      render: (text: number, record: AlarmThreshold) => (
        <InputNumber
          min={0}
          value={text}
          onChange={(value) => handleThresholdChange(record.key, 'min', value)}
          disabled={!record.enabled}
        />
      ),
    },
    {
      title: '最大值',
      dataIndex: 'max',
      key: 'max',
      render: (text: number, record: AlarmThreshold) => (
        <InputNumber
          min={0}
          value={text}
          onChange={(value) => handleThresholdChange(record.key, 'max', value)}
          disabled={!record.enabled}
        />
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: AlarmThreshold) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleEnableChange(record.key, checked)}
        />
      ),
    },
  ];

  const handleThresholdChange = (key: string, field: 'min' | 'max', value: number | null) => {
    if (value === null) return;
    
    const newThresholds = thresholds.map(threshold => {
      if (threshold.key === key) {
        return { ...threshold, [field]: value };
      }
      return threshold;
    });
    setThresholds(newThresholds);
  };

  const handleEnableChange = (key: string, enabled: boolean) => {
    const newThresholds = thresholds.map(threshold => {
      if (threshold.key === key) {
        return { ...threshold, enabled };
      }
      return threshold;
    });
    setThresholds(newThresholds);
  };

  const handleSave = () => {
    // 这里可以添加保存到后端的逻辑
    message.success('报警设置已保存');
  };

  return (
    <div>
      <h2>报警设置</h2>
      <StyledCard>
        <Form form={form} layout="vertical">
          <Table
            columns={columns}
            dataSource={thresholds}
            pagination={false}
            rowKey="key"
          />
          <Button
            type="primary"
            onClick={handleSave}
            style={{ marginTop: 16 }}
          >
            保存设置
          </Button>
        </Form>
      </StyledCard>
    </div>
  );
};

export default AlarmSettings; 