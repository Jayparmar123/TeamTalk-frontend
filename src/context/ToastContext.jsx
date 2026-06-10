import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { FiCheckCircle, FiAlertOctagon, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error'|'info'|'warning' }
  const toastRef = useRef(null);
  const progressRef = useRef(null);
  const timerRef = useRef(null);

  const showToast = (message, type = 'info') => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({ message, type });
  };

  const closeToast = () => {
    if (toastRef.current) {
      gsap.to(toastRef.current, {
        x: 350,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => setToast(null)
      });
    } else {
      setToast(null);
    }
  };

  useEffect(() => {
    if (toast) {
      // Entrance animation
      gsap.fromTo(toastRef.current,
        { x: 300, opacity: 0, scale: 0.9 },
        { x: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.2)' }
      );

      // Animate progress bar shrinking
      if (progressRef.current) {
        gsap.fromTo(progressRef.current,
          { width: '100%' },
          { width: '0%', duration: 5, ease: 'linear' }
        );
      }

      // Auto dismiss after 5 seconds
      timerRef.current = setTimeout(() => {
        closeToast();
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

      {/* Floating Toast Notification Box */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 w-full max-w-sm pointer-events-auto">
          <div
            ref={toastRef}
            className={`relative flex items-start gap-3.5 p-4 rounded-2xl border backdrop-blur-md shadow-2xl overflow-hidden transition-all duration-300 ${styles.bg}`}
          >
            {/* Countdown timer bar */}
            <div
              ref={progressRef}
              className={`absolute bottom-0 left-0 h-[3px] rounded-r-full transition-all ${styles.bar}`}
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
