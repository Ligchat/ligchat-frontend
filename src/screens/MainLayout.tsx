import React from 'react';
import CombinedMenu from '../components/CombinedMenu';

const MainLayout: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh' }}>
      <CombinedMenu />
    </div>
  );
};

export default MainLayout;
