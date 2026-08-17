import styled from "styled-components";

export const Wrapper = styled.div`
  margin-top: 20px;

  @media (max-width: 768px) {
    margin-top: 16px;
  }
`;

export const HeaderTab = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  box-shadow: 2px 2px 8px 2px #00053014;
  border-radius: 8px;

  & .left-column {
    display: flex;
    align-items: center;
    gap: 8px;

    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17.15px;
  }

  @media (max-width: 768px) {
    padding: 10px;

    & .left-column {
      font-size: 13px;
      gap: 6px;
    }
  }
`;

export const ListWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    margin-top: 16px;
    gap: 12px;
  }
`;
