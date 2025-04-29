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
        }, duration - 300);

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
        <div className={`lig-toast lig-toast-${type}`}> 
            <div className="lig-toast-content">
                <div className="lig-toast-icon">
                    {getIcon()}
                </div>
                <div className="lig-toast-message">{message}</div>
                <button className="lig-toast-close" onClick={onClose}>
                    <FiX />
                </button>
            </div>
            <div 
                className={`lig-toast-progress${isClosing ? ' closing' : ''}`}
                style={{ transitionDuration: `${duration}ms` }}
            />
        </div>
    );
};

export const ToastContainer: React.FC<{ 
    children: React.ReactNode;
    style?: React.CSSProperties;
}> = ({ children, style }) => {
    return (
        <div className="lig-toast-container" style={style}>
            {children}
        </div>
    );
};

export default Toast; 