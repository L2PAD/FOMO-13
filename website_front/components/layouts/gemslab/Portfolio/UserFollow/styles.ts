import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  margin-top: 40px;
  h2 {
    margin-bottom: 20px;
    font-weight: var(--font-weight-semibold);
  }
`;
export const Assets = styled.div`
  width: 100%;
  display: flex;
  gap: 20px;
  overflow-x: auto;
  align-items: stretch;
`;

export const Asset = styled(BaseCard)`
  min-width: 280px;
`;

export const ProjectData = styled.div`
  display: flex;
  gap: 8px;

  & .info {
    div {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }
    span {
      font-size: 14px;
      color: var(--main-green);
    }
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

export const PriceInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;

  & .info {
  }

  & .key {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-gray);
  }

  & .value {
    margin-top: 4px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;

export const EmptyState = styled(BaseCard)`
  width: 100%;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  h3 {
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  p {
    font-size: 14px;
    color: var(--main-gray);
    margin: 0;
  }
`;

export const SkeletonCards = styled.div`
  width: 100%;
  display: flex;
  gap: 20px;
  overflow-x: auto;
`;
