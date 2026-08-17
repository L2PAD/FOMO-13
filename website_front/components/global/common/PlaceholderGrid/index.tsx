import React, { FC } from "react";
import Placeholder from "../Placeholder";
import styled from "styled-components";

const Wrapper = styled.div<{ $mobileSingleColumn: boolean }>`
  margin: 20px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 18px;

  @media (max-width: 768px) {
    ${({ $mobileSingleColumn }) =>
      $mobileSingleColumn &&
      `
        & > div {
          width: 100%;
        }
      `}
  }
`;

interface IProps {
  height?: string;
  mobileSingleColumn?: boolean;
}

const PlaceholderGrid: FC<IProps> = ({
  height = "220px",
  mobileSingleColumn = false,
}) => {
  return (
    <Wrapper $mobileSingleColumn={mobileSingleColumn}>
      <Placeholder width="32.3%" height={height} borderRadius="8px" />
      <Placeholder width="32.3%" height={height} borderRadius="8px" />
      <Placeholder width="32.3%" height={height} borderRadius="8px" />
      <Placeholder width="32.3%" height={height} borderRadius="8px" />
      <Placeholder width="32.3%" height={height} borderRadius="8px" />
      <Placeholder width="32.3%" height={height} borderRadius="8px" />
      <Placeholder width="32.3%" height={height} borderRadius="8px" />
      <Placeholder width="32.3%" height={height} borderRadius="8px" />
      <Placeholder width="32.3%" height={height} borderRadius="8px" />
      <Placeholder width="32.3%" height={height} borderRadius="8px" />
    </Wrapper>
  );
};

export default PlaceholderGrid;
