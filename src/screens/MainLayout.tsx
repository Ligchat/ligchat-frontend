import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import CombinedMenu from '../components/CombinedMenu';

const { Content } = Layout;

const MainLayout: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CombinedMenu /> {/* Menu lateral e superior */}
    </Layout>
  );
};

export default MainLayout;
