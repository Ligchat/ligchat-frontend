import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const LoadingOverlay: React.FC = () => {
  const loadingIcon = <LoadingOutlined style={{ fontSize: 48, color: '#fff' }} spin />;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-filter backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center">
        <Spin indicator={loadingIcon} />
      </div>
    </div>
  );
};

export default LoadingOverlay;
