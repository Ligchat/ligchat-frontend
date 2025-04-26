import React, { useState, useRef, useEffect } from 'react';
import RecordRTC, { RecordRTCPromisesHandler } from 'recordrtc';
import { FiMic, FiX, FiSend } from 'react-icons/fi';
import './AudioRecorder.css';

interface AudioRecorderProps {
  onSend: (blob: Blob) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<RecordRTCPromisesHandler | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopAndCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      // Primeiro, verificar se o navegador suporta a API de mídia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta gravação de áudio');
      }

      // Tentar diferentes configurações de áudio
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true }
        }
      });

      streamRef.current = stream;

      // Criar o gravador com configurações otimizadas
      recorderRef.current = new RecordRTCPromisesHandler(stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
        bufferSize: 16384,
        timeSlice: 1000
      });

      await recorderRef.current.startRecording();
      setIsRecording(true);
      setRecordingTime(0);

      // Iniciar o timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Error starting recording:', err);
      let errorMessage = 'Erro ao iniciar gravação';
      
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'Microfone não encontrado. Por favor, conecte um microfone e tente novamente.';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permissão para usar o microfone foi negada. Por favor, permita o acesso ao microfone.';
      }
      
      setError(errorMessage);
      onCancel();
    }
  };

  const stopAndCleanup = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recorderRef.current && isRecording) {
      try {
        await recorderRef.current.stopRecording();
        const blob = await recorderRef.current.getBlob();
        setAudioBlob(blob);
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleStopRecording = async () => {
    await stopAndCleanup();
  };

  const handleSend = async () => {
    if (audioBlob) {
      await stopAndCleanup();
      onSend(audioBlob);
      onCancel();
    }
  };

  const handleCancel = async () => {
    await stopAndCleanup();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="audio-recorder error">
        <div className="audio-recorder-error">
          <span>{error}</span>
          <button onClick={onCancel}>Fechar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-recorder">
      <div className="audio-recorder-content">
        <div className="audio-recorder-indicator">
          <div className={`audio-recorder-pulse ${isRecording ? 'recording' : ''}`}></div>
          <span className="audio-recorder-time">{formatTime(recordingTime)}</span>
        </div>
        <div className="audio-recorder-actions">
          {isRecording ? (
            <button 
              className="audio-recorder-button cancel" 
              onClick={handleStopRecording}
              title="Parar gravação"
            >
              <FiX size={20} />
            </button>
          ) : (
            <>
              <button 
                className="audio-recorder-button cancel" 
                onClick={handleCancel}
                title="Cancelar"
              >
                <FiX size={20} />
              </button>
              {audioBlob && (
                <button 
                  className="audio-recorder-button send" 
                  onClick={handleSend}
                  title="Enviar gravação"
                >
                  <FiSend size={20} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
