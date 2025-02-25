import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface WaveFormProps {
  data: number[];
}

export const WaveForm: React.FC<WaveFormProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const maxBars = useRef(32);

  useEffect(() => {
    const updateMaxBars = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        maxBars.current = Math.floor(containerWidth / 8); // 8px por barra (4px barra + 4px gap)
      }
    };

    updateMaxBars();
    window.addEventListener('resize', updateMaxBars);
    return () => window.removeEventListener('resize', updateMaxBars);
  }, []);

  // Comprima os dados para caber na tela
  const compressedData = data.reduce((acc, val, i) => {
    const index = Math.floor(i * maxBars.current / data.length);
    if (!acc[index]) acc[index] = [];
    acc[index].push(val);
    return acc;
  }, [] as number[][]).map(group => {
    const avg = group.reduce((sum, val) => sum + val, 0) / group.length;
    return Math.min(avg * 1.2, 1); // Amplifica um pouco, mas limita a 1
  });

  return (
    <div className="waveform-container" ref={containerRef}>
      {compressedData.map((value, index) => (
        <motion.div
          key={index}
          className="waveform-bar"
          initial={{ height: 2, opacity: 0 }}
          animate={{ 
            height: Math.max(4, value * 50),
            opacity: value > 0.05 ? 0.8 : 0.3,
            scale: value > 0.1 ? 1 : 0.8
          }}
          transition={{ 
            height: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.1 },
            scale: { duration: 0.2 }
          }}
          style={{
            backgroundColor: 'var(--primary-color)',
            width: '4px',
            borderRadius: '2px',
            margin: '0 2px',
            transformOrigin: 'bottom'
          }}
        />
      ))}
    </div>
  );
}; 