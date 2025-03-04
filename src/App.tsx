import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import styled from 'styled-components';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EnvironmentControl from './pages/EnvironmentControl';
import AlarmSettings from './pages/AlarmSettings';
import DataAnalysis from './pages/DataAnalysis';

// 导入antd样式
import 'antd/dist/reset.css';

const { Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledContent = styled(Content)`
  margin: 24px 16px;
  padding: 24px;
  background: #fff;
  min-height: 280px;
`;

const App: React.FC = () => {
  return (
    <StyledLayout>
      <Sidebar />
      <Layout>
        <StyledContent>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/control" element={<EnvironmentControl />} />
            <Route path="/alarms" element={<AlarmSettings />} />
            <Route path="/analysis" element={<DataAnalysis />} />
          </Routes>
        </StyledContent>
      </Layout>
    </StyledLayout>
  );
};

export default App; 