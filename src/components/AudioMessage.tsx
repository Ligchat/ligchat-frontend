import React, { useState, useRef, useEffect, useMemo } from 'react';
import './AudioMessage.css';

interface AudioMessageProps {
  src: string;
  isSent: boolean;
  onCancel?: () => void;
}

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" fill="currentColor"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z" fill="currentColor"/>
  </svg>
);

export const AudioMessage: React.FC<AudioMessageProps> = ({ src, isSent, onCancel }) => {
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
        const samples = 50;
        const blockSize = Math.floor(channelData.length / samples);
        const dataPoints: number[] = [];

        let maxValue = 0;
        for (let i = 0; i < channelData.length; i++) {
          const absValue = Math.abs(channelData[i]);
          if (absValue > maxValue) maxValue = absValue;
        }

        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          let count = 0;
          
          for (let j = 0; j < blockSize; j++) {
            if (blockStart + j < channelData.length) {
              sum += channelData[blockStart + j] ** 2;
              count++;
            }
          }
          
          const rms = Math.sqrt(sum / count);
          const normalized = Math.max(0.2, Math.min(1, (rms / maxValue)));
          const logScaled = 0.2 + Math.log10(normalized * 9 + 1) * 0.8;
          
          dataPoints.push(logScaled);
        }

        const smoothedPoints = dataPoints.map((point, index, array) => {
          if (index === 0) return point;
          if (index === array.length - 1) return point;
          return (array[index - 1] + point + array[index + 1]) / 3;
        });

        setAudioData(smoothedPoints);
      } catch (error) {
        console.error('Erro ao analisar áudio:', error);
        const fallbackData = Array(50).fill(0).map(() => 
          0.2 + Math.random() * 0.6
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
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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

    setCurrentTime(audio.currentTime);
    animationRef.current = requestAnimationFrame(updateTime);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !waveformRef.current || !duration) return;

    const rect = waveformRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    const newTime = percentage * duration;

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

  const progress = useMemo(() => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  return (
    <div className={`audio-message ${isSent ? 'sent' : 'received'}`}>
      <button 
        className="play-button" 
        onClick={togglePlay}
        disabled={!isLoaded}
        aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      
      <div className="audio-content">
        <div 
          className="waveform-container" 
          ref={waveformRef}
          onClick={handleWaveformClick}
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
        >
          <div className="waveform-wrapper">
            {audioData.map((amplitude, index) => (
              <div
                key={index}
                className={`waveform-bar ${(index / audioData.length) * 100 <= progress ? 'played' : ''}`}
                style={{
                  transform: `scaleY(${amplitude})`
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="message-info">
        <span className="message-time">
          {formatTime(currentTime)} / {formatTime(duration || 0)}
        </span>
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