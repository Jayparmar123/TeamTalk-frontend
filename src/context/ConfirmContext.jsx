import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { FiAlertTriangle } from 'react-icons/fi';

const ConfirmContext = createContext(null);

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState({ title: '', message: '', confirmText: 'Confirm', cancelText: 'Cancel' });
  const [resolveRef, setResolveRef] = useState(null);

  const modalRef = useRef(null);
  const backdropRef = useRef(null);

  const confirm = (message, title = 'Confirmation Required', confirmText = 'Confirm', cancelText = 'Cancel') => {
    setOptions({ title, message, confirmText, cancelText });
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  };

  useEffect(() => {
    if (isOpen) {
      // Backdrop fade in
      gsap.fromTo(backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );
      // Modal scale up and slide down
      gsap.fromTo(modalRef.current,
        { scale: 0.9, y: -20, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.5)' }
      );
    }
  }, [isOpen]);

  const handleConfirm = () => {
    gsap.to(modalRef.current, {
      scale: 0.95,
      y: 10,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        setIsOpen(false);
        if (resolveRef) resolveRef(true);
      }
    });
    gsap.to(backdropRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in'
    });
  };

  const handleCancel = () => {
    gsap.to(modalRef.current, {
      scale: 0.95,
      y: 10,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        setIsOpen(false);
        if (resolveRef) resolveRef(false);
      }
    });
    gsap.to(backdropRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in'
    });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {isOpen && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div
            ref={modalRef}
            className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-2xl text-center space-y-4"
          >
            {/* Warning Icon Badge */}
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shadow-primary/5">
              <FiAlertTriangle size={24} />
            </div>

            <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
              {options.title}
            </h3>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">
              {options.message}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-wider transition-all"
              >
                {options.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-accent-indigo hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                {options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
