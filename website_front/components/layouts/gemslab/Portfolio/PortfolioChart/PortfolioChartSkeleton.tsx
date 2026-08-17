import React from "react";
import styled from "styled-components";
import Placeholder from "../../../../global/common/Placeholder";

const SkeletonWrapper = styled.div`
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: space-between;
  padding: 8px 0;
`;

const SkeletonTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

const SkeletonFilterRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const SkeletonChartArea = styled.div`
  display: grid;
  gap: 12px;
`;

const PortfolioChartSkeleton: React.FC = () => {
  return (
    <SkeletonWrapper>
      <SkeletonTopRow>
        <Placeholder
          width="180px"
          height="20px"
          borderRadius="8px"
          marginBottom="0"
        />
        <SkeletonFilterRow>
          {["48px", "44px", "48px", "48px", "44px", "44px", "36px"].map(
            (width) => (
              <Placeholder
                key={width}
                width={width}
                height="32px"
                borderRadius="8px"
                marginBottom="0"
              />
            )
          )}
        </SkeletonFilterRow>
      </SkeletonTopRow>

      <SkeletonChartArea>
        <Placeholder
          width="112px"
          height="12px"
          borderRadius="999px"
          marginBottom="0"
        />
        <Placeholder
          width="100%"
          height="320px"
          borderRadius="16px"
          marginBottom="0"
        />
      </SkeletonChartArea>
    </SkeletonWrapper>
  );
};

export default PortfolioChartSkeleton;
