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
`;

export const Asset = styled(BaseCard)`
  min-width: 24%;
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
      font-weight: var(--font-weight-semibold);
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
  display: flex;
  align-items: center;
  justify-content: space-between;

  & .info {
  }

  & .key {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-gray);
  }

  & .value {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;
