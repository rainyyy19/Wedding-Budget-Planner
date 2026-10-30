import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const bgColors = {
    success: 'var(--color-success)',
    error: 'var(--color-danger)',
    info: 'var(--color-burgundy)',
    warning: 'var(--color-warning)'
  };

  const icons = {
    success: <CheckCircle2 size={18} color="#FFFFFF" />,
    error: <AlertCircle size={18} color="#FFFFFF" />,
    info: <Info size={18} color="#FFFFFF" />,
    warning: <AlertCircle size={18} color="#FFFFFF" />
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      backgroundColor: bgColors[type] || bgColors.info,
      color: '#FFFFFF',
      padding: '12px 18px',
      borderRadius: 'var(--radius-md)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 2000,
      maxWidth: '420px',
      animation: 'slideUp 0.25s ease'
    }}>
      {icons[type]}
      <span style={{ fontSize: '0.9rem', fontWeight: 500, flex: 1, lineHeight: 1.4 }}>
        {message}
      </span>
      <button 
        onClick={onClose}
        style={{ color: '#FFFFFF', opacity: 0.8, padding: '2px', display: 'flex' }}
      >
        <X size={16} />
      </button>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
