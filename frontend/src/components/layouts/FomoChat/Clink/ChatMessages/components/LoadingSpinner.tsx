import React, { FC } from "react";

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  text = "Loading messages...",
  fullScreen = false,
}) => {
  const containerStyle = fullScreen
    ? {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        width: "100%",
        position: "absolute" as const,
        top: "50%",
        left: "0",
        transform: "translateY(-50%)",
        color: "#728094",
      }
    : {
        display: "flex",
        justifyContent: "center",
        padding: "16px 0",
        gap: "8px",
        alignItems: "center",
        color: "#728094",
        fontSize: "14px",
        fontWeight: "var(--font-weight-medium)" as const,
        backgroundColor: "rgba(7, 11, 53, 0.02)",
        borderBottom: "1px solid rgba(114, 128, 148, 0.1)",
      };

  return <div style={containerStyle}>{text}</div>;
};

export default LoadingSpinner;
