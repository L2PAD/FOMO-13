import React, { FC } from "react";

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ 
  size = 16, 
  text = "Loading messages...",
  fullScreen = false 
}) => {
  const containerStyle = fullScreen ? {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    width: '100%',
    position: 'absolute' as const,
    top: '50%',
    left: '0',
    transform: 'translateY(-50%)',
    color: '#728094'
  } : {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px 0',
    gap: '8px',
    alignItems: 'center',
    color: '#728094',
    fontSize: '14px',
    fontWeight: "var(--font-weight-medium)" as const,
    backgroundColor: 'rgba(7, 11, 53, 0.02)',
    borderBottom: '1px solid rgba(114, 128, 148, 0.1)'
  };

  const spinnerSize = fullScreen ? 40 : size;

  return (
    <div style={containerStyle}>
      <div style={{
        width: `${spinnerSize}px`,
        height: `${spinnerSize}px`,
        border: fullScreen ? '3px solid rgba(7, 11, 53, 0.1)' : '2px solid rgba(7, 11, 53, 0.2)',
        borderTopColor: '#070B35',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={fullScreen ? {
        fontSize: '16px',
        fontWeight: "var(--font-weight-medium)"
      } : undefined}>{text}</span>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
