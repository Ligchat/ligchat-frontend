import React, { useState, useRef, useEffect } from 'react';
import RecordRTC, { RecordRTCPromisesHandler } from 'recordrtc';
import { FiMic, FiX, FiSend } from 'react-icons/fi';
import './AudioRecorder.css';

interface AudioRecorderProps {
  onSend: (blob: Blob) => void;
  onCancel: () => void;
}

interface InternalRecorder {
  stream: MediaStream;
  [key: string]: any;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const recorderRef = useRef<RecordRTCPromisesHandler | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        recorderRef.current = new RecordRTCPromisesHandler(stream, {
          type: 'audio',
          mimeType: 'audio/webm',
          recorderType: RecordRTC.StereoAudioRecorder,
          numberOfAudioChannels: 1,
          desiredSampRate: 16000,
          timeSlice: 250,
          ondataavailable: (blob: Blob) => {
            console.log('Audio data available:', blob.size);
          }
        });

        await recorderRef.current.startRecording();
        setIsRecording(true);
        setRecordingTime(0);

        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } catch (error) {
        console.error('Error starting recording:', error);
      }
    };

    startRecording();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const stopAndCleanup = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (recorderRef.current) {
      try {
        await recorderRef.current.stopRecording();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  const handleStopRecording = async () => {
    if (!recorderRef.current) return;

    try {
      await recorderRef.current.stopRecording();
      const blob = await recorderRef.current.getBlob();
      setAudioBlob(blob);
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
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

  return (
    <div className="audio-recorder">
      <div className="audio-recorder-content">
        <div className="audio-recorder-indicator">
          <div className="audio-recorder-pulse"></div>
          <span className="audio-recorder-time">{formatTime(recordingTime)}</span>
        </div>
        <div className="audio-recorder-actions">
          <button 
            className="audio-recorder-button cancel" 
            onClick={isRecording ? handleStopRecording : handleCancel}
            title={isRecording ? "Parar gravação" : "Cancelar"}
          >
            <FiX size={20} />
          </button>
          {!isRecording && audioBlob && (
            <button 
              className="audio-recorder-button send" 
              onClick={handleSend}
              title="Enviar gravação"
            >
              <FiSend size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
