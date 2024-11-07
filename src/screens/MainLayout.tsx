import React from 'react';
import { Layout } from 'antd';
import CombinedMenu from '../components/CombinedMenu';

const MainLayout: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CombinedMenu />
    </Layout>
  );
};

export default MainLayout;
