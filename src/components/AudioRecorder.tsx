import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import { Button } from 'antd';

interface AudioRecorderProps {
  onCancel: () => void; 
  onSend: (blob: Blob) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onCancel, onSend }) => {
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(40).fill(0.05));
  const [isActive, setIsActive] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const animationFrameRef = useRef<number>();
  const timerRef = useRef<NodeJS.Timer>();
  const streamRef = useRef<MediaStream>();

  useEffect(() => {
    startRecording();
    return () => cleanup();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Configurar AudioContext para visualização
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.7;
        analyserRef.current.minDecibels = -85;
        analyserRef.current.maxDecibels = -10;
        source.connect(analyserRef.current);
      }

      // Configurar MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Iniciar gravação
      mediaRecorderRef.current.start(100);
      setIsActive(true);
      updateWaveform();
      startTimer();

    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      setIsActive(false);
    }
  };

  const updateWaveform = () => {
    if (!analyserRef.current || !isActive) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Processa os dados para criar uma forma de onda mais suave
    const normalizedData = Array.from(dataArray)
      .slice(0, 40)
      .map(value => {
        const normalized = value / 255;
        return Math.min(Math.max(normalized * 1.5, 0.05), 1);
      });

    setWaveformData(normalizedData);
    
    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanup = () => {
    setIsActive(false);

    // Limpa o timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Cancela a animação
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Para a gravação
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Para todas as tracks do stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Fecha o AudioContext apenas se estiver em um estado que permita fechamento
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
  };

  const handleSend = () => {
    if (!mediaRecorderRef.current || !isActive) return;

    setIsActive(false);
    
    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/ogg; codecs=opus' 
        });
        onSend(audioBlob);
        cleanup();
      };
    }
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className="recording-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div className="recording-indicator" />
      
      <div className="waveform-container">
        <AnimatePresence>
          {waveformData.map((value, index) => (
            <motion.div
              key={index}
              className="waveform-bar"
              initial={{ height: 2 }}
              animate={{ 
                height: `${value * 48}px`,
                opacity: value > 0.05 ? 0.8 : 0.3,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <span className="recording-time">{formatTime(duration)}</span>

      <div className="recording-actions">
        <Button
          type="text"
          icon={<CloseOutlined />}
          className="cancel-recording"
          onClick={handleCancel}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          className="send-recording"
          onClick={handleSend}
        />
      </div>
    </motion.div>
  );
}; 