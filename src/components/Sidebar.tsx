import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ControlOutlined,
  AlertOutlined,
  AreaChartOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

const { Sider } = Layout;

const StyledSider = styled(Sider)`
  .logo {
    height: 32px;
    margin: 16px;
    background: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 16px;
    font-weight: bold;
  }
`;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '实时监控',
    },
    {
      key: '/control',
      icon: <ControlOutlined />,
      label: '环境控制',
    },
    {
      key: '/alarms',
      icon: <AlertOutlined />,
      label: '报警设置',
    },
    {
      key: '/analysis',
      icon: <AreaChartOutlined />,
      label: '数据分析',
    },
  ];

  return (
    <StyledSider
      breakpoint="lg"
      collapsedWidth="0"
    >
      <div className="logo">智慧农业</div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </StyledSider>
  );
};

export default Sidebar; 