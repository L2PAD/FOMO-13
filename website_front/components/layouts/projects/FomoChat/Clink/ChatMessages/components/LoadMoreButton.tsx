import React, { FC } from "react";

interface LoadMoreButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const LoadMoreButton: FC<LoadMoreButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '12px 0',
      borderBottom: '1px solid rgba(114, 128, 148, 0.1)'
    }}>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          padding: '8px 16px',
          backgroundColor: 'transparent',
          color: 'var(--main-green)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: "var(--font-weight-medium)",
          transition: 'all 0.2s'
        }}
      >
        Load More Messages
      </button>
    </div>
  );
};

export default LoadMoreButton;
