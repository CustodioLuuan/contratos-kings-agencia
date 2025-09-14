import React, { useEffect } from 'react';
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  isVisible: boolean;
  onClose: () => void;
  type: NotificationType;
  title: string;
  message: string;
  autoHide?: boolean;
  duration?: number;
}

export default function Notification({ 
  isVisible, 
  onClose, 
  type, 
  title, 
  message, 
  autoHide = true, 
  duration = 5000 
}: NotificationProps) {
  useEffect(() => {
    if (isVisible && autoHide) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHide, duration, onClose]);

  if (!isVisible) return null;

  const getNotificationStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-500/90 backdrop-blur-sm border border-green-400/30',
          icon: 'bg-green-400/20',
          iconComponent: <CheckCircle2 className="h-5 w-5 text-green-400" />,
          closeButton: 'text-green-200 hover:text-white'
        };
      case 'error':
        return {
          container: 'bg-red-500/90 backdrop-blur-sm border border-red-400/30',
          icon: 'bg-red-400/20',
          iconComponent: <AlertCircle className="h-5 w-5 text-red-400" />,
          closeButton: 'text-red-200 hover:text-white'
        };
      case 'warning':
        return {
          container: 'bg-yellow-500/90 backdrop-blur-sm border border-yellow-400/30',
          icon: 'bg-yellow-400/20',
          iconComponent: <AlertCircle className="h-5 w-5 text-yellow-400" />,
          closeButton: 'text-yellow-200 hover:text-white'
        };
      case 'info':
        return {
          container: 'bg-blue-500/90 backdrop-blur-sm border border-blue-400/30',
          icon: 'bg-blue-400/20',
          iconComponent: <Info className="h-5 w-5 text-blue-400" />,
          closeButton: 'text-blue-200 hover:text-white'
        };
      default:
        return {
          container: 'bg-green-500/90 backdrop-blur-sm border border-green-400/30',
          icon: 'bg-green-400/20',
          iconComponent: <CheckCircle2 className="h-5 w-5 text-green-400" />,
          closeButton: 'text-green-200 hover:text-white'
        };
    }
  };

  const styles = getNotificationStyles();

  return (
    <div className="fixed top-4 right-4 z-50 rounded-lg p-4 shadow-lg max-w-sm">
      <div className={`${styles.container} rounded-lg p-4`}>
        <div className="flex items-center space-x-3">
          <div className={`${styles.icon} p-2 rounded-lg`}>
            {styles.iconComponent}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-white">{title}</h4>
            <p className="text-sm text-white/90">{message}</p>
          </div>
          <button
            onClick={onClose}
            className={`${styles.closeButton} transition-colors`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
