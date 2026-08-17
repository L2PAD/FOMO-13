import React from "react";
import styled, { keyframes } from "styled-components";

interface PlaceholderProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  marginBottom?: string;
  description?: string;
}

const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
`;

const PlaceholderWrapper = styled.div<PlaceholderProps>`
  width: ${({ width }) => width || "100%"};
  height: ${({ height }) => height || "20px"};
  background: linear-gradient(
    90deg,
    rgba(224, 224, 224, 0.5) 30%,
    rgba(255, 255, 255, 0.8) 50%,
    rgba(224, 224, 224, 0.5) 70%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 2s infinite;
  border-radius: ${({ borderRadius }) => borderRadius || "4px"};
  margin-bottom: ${({ marginBottom }) => marginBottom || "8px"};
  box-sizing: border-box;

  display: flex;
  align-items: center;
  justify-content: center;

  & .description-text {
    font-size: 16px;
    color: var(--main-gray);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: rgba(224, 224, 224, 0.62);
  }
`;

const Placeholder: React.FC<PlaceholderProps> = ({
  width,
  height,
  borderRadius,
  marginBottom,
  description,
}) => {
  return (
    <PlaceholderWrapper
      width={width}
      height={height}
      borderRadius={borderRadius}
      marginBottom={marginBottom}
    >
      {description ? (
        <div className="description-text">{description}</div>
      ) : (
        <></>
      )}
    </PlaceholderWrapper>
  );
};

export default Placeholder;
