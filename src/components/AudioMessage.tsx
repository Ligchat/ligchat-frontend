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
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Gerar barras aleatórias uma vez na montagem do componente
  const [bars] = useState(() => 
    Array.from({ length: 40 }, () => Math.random() * 35 + 5)
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log('Áudio carregado, duração:', audio.duration);
      setDuration(audio.duration);
      setIsLoaded(true);
    };

    const handleLoadedData = () => {
      console.log('Dados do áudio carregados');
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
        setIsLoaded(true);
      }
    };

    const handleDurationChange = () => {
      console.log('Duração alterada:', audio.duration);
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

    // Adiciona todos os event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Se o áudio já estiver carregado, atualiza a duração
    if (audio.readyState >= 2) {
      handleLoadedMetadata();
    }

    // Força o carregamento do áudio
    audio.load();

    return () => {
      // Remove todos os event listeners
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [src]); // Adiciona src como dependência para recarregar quando mudar

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
            {bars.map((height, index) => {
              const barPosition = (index / bars.length) * 100;
              const isPlayed = barPosition <= progress;
              
              return (
                <div
                  key={index}
                  className={`waveform-bar ${isPlayed ? 'played' : ''}`}
                  style={{
                    height: `${height}px`,
                    left: `${barPosition}%`,
                    transition: 'all 0.1s ease-in-out'
                  }}
                />
              );
            })}
          </div>
        </div>
        
        <div className="message-info">
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