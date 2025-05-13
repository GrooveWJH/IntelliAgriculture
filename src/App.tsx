import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import styled from 'styled-components';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EnvironmentControl from './pages/EnvironmentControl';
import AlarmSettings from './pages/AlarmSettings';
import DataAnalysis from './pages/DataAnalysis';
import NotificationPanel from './components/NotificationPanel';
import InterferencePanel from './components/InterferencePanel';
import { SensorDataProvider } from './contexts/SensorDataContext';
import Settings from './pages/Settings';
import ConfigurationPage from './pages/ConfigurationPage';

// Import antd styles
import 'antd/dist/reset.css';

const { Content, Sider } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  display: flex;
  flex-direction: row;
  background: #f0f2f5;
`;

const StyledSider = styled(Sider)`
  flex: 0 0 240px;
  width: 240px !important;
  min-width: 240px !important;
  max-width: 240px !important;
  height: 100vh;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  left: 0;
`;

const StyledContent = styled(Content)`
  flex: 1;
  padding: 24px;
  background: #fff;
  overflow: auto;
  min-height: 100vh;
  margin: 0;
  
  // 添加内部容器来处理通知面板和主要内容
  .content-container {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
`;

const App: React.FC = () => {
  const handleAddInterference = (values: any) => {
    // 处理添加干扰的逻辑
    console.log('Adding interference:', values);
  };

  return (
    <SensorDataProvider>
      <StyledLayout>
        <StyledSider>
          <Sidebar />
        </StyledSider>
        <StyledContent>
          <div className="content-container">
            <NotificationPanel />
            <InterferencePanel onAddInterference={handleAddInterference} />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/control" element={<EnvironmentControl />} />
              <Route path="/alarm" element={<AlarmSettings />} />
              <Route path="/analysis" element={<DataAnalysis />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/configuration" element={<ConfigurationPage />} />
            </Routes>
          </div>
        </StyledContent>
      </StyledLayout>
    </SensorDataProvider>
  );
};

export default App; 