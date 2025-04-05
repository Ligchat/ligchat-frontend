import React, { useEffect, useState, useRef } from 'react';
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi';
import './Toast.css';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
    message, 
    type, 
    onClose,
    duration = 3000 
}) => {
    const [isClosing, setIsClosing] = useState(false);
    const timerRef = useRef<number>();

    useEffect(() => {
        setIsClosing(false);

        timerRef.current = window.setTimeout(() => {
            setIsClosing(true);
        }, 100);

        const timer = window.setTimeout(() => {
            onClose();
        }, duration);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            clearTimeout(timer);
        };
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <FiCheck />;
            case 'error':
                return <FiAlertCircle />;
            default:
                return <FiInfo />;
        }
    };

    return (
        <div className={`toast ${type}`}>
            <div className="toast-content">
                <div className="toast-icon">
                    {getIcon()}
                </div>
                <div className="toast-message">{message}</div>
                <button className="toast-close" onClick={onClose}>
                    <FiX />
                </button>
            </div>
            <div 
                className={`toast-progress ${isClosing ? 'closing' : ''}`}
            />
        </div>
    );
};

export default Toast; 