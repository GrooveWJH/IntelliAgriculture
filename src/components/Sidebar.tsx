import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ControlOutlined,
  AlertOutlined,
  LineChartOutlined,
  SettingOutlined,
  FundOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

const Logo = styled.div`
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.85);
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background-color: white;
  .logo-icon {
    font-size: 24px;
    margin-right: 8px;
    color: #1890ff;
  }
`;

const SidebarContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MenuContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;
`;

const MainMenu = styled(Menu)`
  flex: 1;
  .ant-menu-item {
    transition: color 0.3s ease !important;
    &.ant-menu-item-selected {
      color: white !important;
    }
  }
`;

const SettingsMenu = styled(Menu)`
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: auto;
  padding: 16px 0;
  .ant-menu-item {
    transition: color 0.3s ease !important;
    &.ant-menu-item-selected {
      color: white !important;
    }
  }
`;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const mainMenuItems = [
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
      key: '/alarm',
      icon: <AlertOutlined />,
      label: '报警设置',
    },
    {
      key: '/analysis',
      icon: <LineChartOutlined />,
      label: '数据分析',
    },
  ];

  const settingsMenuItem = {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  };

  return (
    <SidebarContainer>
      <Logo>
        <FundOutlined className="logo-icon" />
        IntelliAgriculture
      </Logo>
      <MenuContainer>
        <MainMenu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={mainMenuItems}
          onClick={({ key }) => navigate(key)}
        />
        <SettingsMenu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={[settingsMenuItem]}
          onClick={({ key }) => navigate(key)}
        />
      </MenuContainer>
    </SidebarContainer>
  );
};

export default Sidebar; 