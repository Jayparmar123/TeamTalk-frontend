import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { FiCheckCircle, FiAlertOctagon, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error'|'info'|'warning' }
  const timerRef = useRef(null);

  const showToast = (message, type = 'info') => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Reset by setting null first so re-triggering the same type replays the CSS animation
    setToast(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToast({ message, type });
      });
    });
  };

  const closeToast = () => {
    setToast(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  useEffect(() => {
    if (toast) {
      timerRef.current = setTimeout(() => {
        setToast(null);
      }, 5000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast]);

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          bar: 'bg-emerald-500',
          icon: <FiCheckCircle size={20} className="text-emerald-400" />
        };
      case 'error':
        return {
          bg: 'bg-red-500/10 border-red-500/20 text-red-400',
          bar: 'bg-red-500',
          icon: <FiAlertOctagon size={20} className="text-red-400" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          bar: 'bg-amber-500',
          icon: <FiAlertTriangle size={20} className="text-amber-400" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          bar: 'bg-blue-500',
          icon: <FiInfo size={20} className="text-blue-400" />
        };
    }
  };

  const styles = toast ? getToastStyles(toast.type) : null;

  return (
    <ToastContext.Provider value={{ showToast, closeToast }}>
      {children}

      {/* Floating Toast Notification — CSS slide-in animation */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 w-full max-w-sm pointer-events-auto animate-toast-enter">
          <div
            className={`relative flex items-start gap-3.5 p-4 rounded-2xl border backdrop-blur-md shadow-2xl overflow-hidden ${styles.bg}`}
          >
            {/* Countdown timer bar — CSS width animation */}
            <div
              className={`absolute bottom-0 left-0 h-[3px] rounded-r-full animate-progress-bar ${styles.bar}`}
            />

            {/* Icon */}
            <div className="mt-0.5 shrink-0">{styles.icon}</div>

            {/* Message payload */}
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-0.5">{toast.type}</p>
              <p className="text-sm font-semibold leading-relaxed text-gray-800 dark:text-white break-words">
                {toast.message}
              </p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={closeToast}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/5"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
