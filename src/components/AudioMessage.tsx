import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PlayCircleFilled, PauseCircleFilled } from '@ant-design/icons';
import './AudioMessage.css';

interface AudioMessageProps {
  src: string;
  isSent: boolean;
}

export const AudioMessage: React.FC<AudioMessageProps> = ({ src, isSent }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const analyzeAudio = async () => {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const channelData = audioBuffer.getChannelData(0);
        const samples = 40;
        const blockSize = Math.floor(channelData.length / samples);
        const dataPoints: number[] = [];

        // Encontrar o valor máximo para normalização
        let maxValue = 0;
        for (let i = 0; i < channelData.length; i++) {
          const absValue = Math.abs(channelData[i]);
          if (absValue > maxValue) maxValue = absValue;
        }

        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let max = 0;
          
          // Encontrar o pico de amplitude em cada bloco
          for (let j = 0; j < blockSize; j++) {
            const absValue = Math.abs(channelData[blockStart + j]);
            if (absValue > max) max = absValue;
          }

          // Normalizar e aplicar uma curva logarítmica para melhor visualização
          const normalized = Math.max(0.15, Math.min(1, (max / maxValue)));
          const logScaled = 0.3 + Math.log10(normalized * 9 + 1) * 0.7;
          
          dataPoints.push(logScaled);
        }

        // Suavizar as transições entre as barras
        const smoothedPoints = dataPoints.map((point, index) => {
          if (index === 0 || index === dataPoints.length - 1) return point;
          return (dataPoints[index - 1] + point + dataPoints[index + 1]) / 3;
        });

        setAudioData(smoothedPoints);
      } catch (error) {
        console.error('Erro ao analisar áudio:', error);
        // Gerar um fallback com alguma variação
        const fallbackData = Array(40).fill(0).map(() => 
          0.3 + Math.random() * 0.4
        );
        setAudioData(fallbackData);
      }
    };

    analyzeAudio();
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };

    const handleLoadedData = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
        setIsLoaded(true);
      }
    };

    const handleDurationChange = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      if (Number.isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (audio.readyState >= 2) {
      handleLoadedMetadata();
    }

    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      } else {
        await audio.play();
        animationRef.current = requestAnimationFrame(updateTime);
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
    }
  };

  const updateTime = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (Number.isFinite(audio.currentTime)) {
      setCurrentTime(audio.currentTime);
    }
    animationRef.current = requestAnimationFrame(updateTime);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !waveformRef.current || !duration) return;

    const rect = waveformRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    const newTime = Math.min(Math.max(percentage * duration, 0), duration);

    if (Number.isFinite(newTime)) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calcular a porcentagem de progresso
  const progress = useMemo(() => {
    if (!duration || !Number.isFinite(currentTime)) return 0;
    return Math.min(Math.max((currentTime / duration) * 100, 0), 100);
  }, [currentTime, duration]);

  return (
    <div className={`audio-message ${isSent ? 'sent' : 'received'}`}>
      <button 
        className="play-button" 
        onClick={togglePlay}
        disabled={!isLoaded}
        aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
      >
        {isPlaying ? <PauseCircleFilled /> : <PlayCircleFilled />}
      </button>
      
      <div className="audio-content">
        <div 
          className="waveform-container" 
          ref={waveformRef}
          onClick={handleWaveformClick}
        >
          <div className="waveform-wrapper">
            {audioData.map((amplitude, index) => {
              const isPlayed = (index / audioData.length) * 100 <= progress;
              return (
                <div
                  key={index}
                  className={`waveform-bar ${isPlayed ? 'played' : ''}`}
                  style={{
                    transform: `scaleY(${amplitude})`
                  }}
                />
              );
            })}
          </div>
        </div>
        
        <div className="message-info">
          <span className="message-time">
            {isLoaded ? formatTime(currentTime) : '--:--'} / {isLoaded ? formatTime(duration) : '--:--'}
          </span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onError={(e) => console.error('Erro ao carregar áudio:', e)}
      />
    </div>
  );
};