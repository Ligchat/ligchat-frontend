import React from 'react';
import { FiLoader } from 'react-icons/fi';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-filter backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center">
        <FiLoader className="animate-spin text-white" size={48} />
      </div>
    </div>
  );
};

export default LoadingOverlay;
