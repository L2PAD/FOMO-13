import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  & .body {
    margin-top: 20px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  @media (max-width: 768px) {
    .body {
      height: 300px;
      margin-top: 0px;
    }
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  & .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  & .header-actions {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  h3 {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;

    @media (max-width: 920px) {
      font-size: 14px;
    }
  }
`;

export const Tabs = styled.div`
  display: flex;
  gap: 20px;
`;
