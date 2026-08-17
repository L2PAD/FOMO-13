import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const UserHeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
  margin-top: 10px;
  flex-wrap: wrap;
  gap: 10px;
`;

export const UserHeaderLeftWrapper = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

export const UserHeaderRightWrapper = styled.div`
  display: flex;
  gap: 22px;
  align-items: center;

  button,
  a {
    border: none;
    padding: 0;
    background: none;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-primary);
  }
`;

export const UserHeaderDataWrapper = styled.div<{ delta: number }>`
  & > p {
    font-weight: var(--font-weight-regular);
    font-size: 18px;
    line-height: 21px;
    color: var(--color-text-muted);

    @media (max-width: 470px) {
      font-size: 14px;
    }
  }

  & > div {
    display: flex;
    gap: 12px;

    & > p {
      font-weight: var(--font-weight-semibold);
      font-size: 32px;
      line-height: 39px;
      color: var(--color-text-primary);

      @media (max-width: 470px) {
        font-size: 18px;
      }
    }

    & > div {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 10px;

      span {
        font-weight: var(--font-weight-regular);
        font-size: 16px;
        line-height: 19px;
        color: ${({ delta }) => (delta > 0 ? "var(--color-primary)" : "var(--color-danger)")};
      }
    }
  }
`;

export const UserHeaderBottomDataWrapper = styled.div`
  display: flex;
  margin-bottom: 32px;
  gap: 32px;
  align-items: center;
  flex-wrap: wrap;
`;

export const UserHeaderBottomDataItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);
  }

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;

    i {
      font-weight: var(--font-weight-regular);
    }
  }
`;

export const ConnectionWrapper = styled(BaseCard)`
  padding: 8px 12px !important;
  display: flex;
  gap: 10px;
  align-items: center;

  @media (max-width: 1200px) {
    width: calc(33% - 8px) !important;
  }

  @media (max-width: 900px) {
    width: calc(50% - 8px) !important;
  }

  @media (max-width: 600px) {
    width: 100% !important;
  }
`;

export const ConnectionsPostData = styled.div`
  width: 145px;

  h6 {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
  }

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }
`;
export const ConnectionsPostContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: calc(100% - 42px);

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-primary);
  }
`;

export const ConnectionsPostsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

export const ContentWrapper = styled.div`
  margin-bottom: 64px;

  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 20px;
    line-height: 24px;
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }
`;

export const PortfolioCardsWrapper = styled.div`
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  margin-top: 12px;
`;

export const GraphicsWrapper = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 64px;
  flex-wrap: wrap;
  gap: 16px;

  & > div {
    width: 585px;
  }
`;

export const TabsWrapper = styled.div`
  margin-top: 8px;
`;

export const TableWrapper = styled(BaseCard)`
  padding: 0;
  max-width: calc(100vw - 35px);
  width: 100%;
`;

export const TableHeader = styled.div`
  display: flex;
  padding: 12px 16px;
  background: rgba(115, 128, 148, 0.05);
  width: 592px !important;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);

    &:first-child {
      width: 206px;
    }
  }
`;

export const TabsTableRowsWrapper = styled.div`
  max-height: 260px;
  overflow-y: auto;
  width: 592px !important;
`;

export const TabTableRowWrapper = styled.div`
  display: flex;
  padding: 16px;
  border-bottom: 1px solid #f8f8f9;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;

    &:first-child {
      width: 206px;
    }
    &:last-child {
      display: flex;
      gap: 14px;
      align-items: center;
    }
  }
`;

export const TabsTableProgress = styled.div<{
  progress: number;
  right: boolean;
}>`
  background: rgba(39, 122, 210, 0.1);
  border-radius: 8px;
  width: 266px;
  height: 8px;
  display: flex;
  justify-content: ${({ right }) => (right ? "flex-end" : "flex-start")};

  div {
    background: ${({ right }) => (right ? "var(--color-danger)" : "#277AD2")};
    border-radius: 8px;
    width: ${({ progress, right }) => (right ? -progress : progress)}%;
    height: 8px;
  }
`;

export const TableFilterWrapper = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
`;

export const ExchangeGraphicWrapper = styled(BaseCard)`
  width: 100%;
  margin-top: 16px;
  padding: 16px 0 0;
`;

export const PieContentWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
`;

export const CounterTableWrapper = styled(BaseCard)`
  padding: 0;
  width: 1200px;
  overflow-x: auto;
  margin-top: 8px;
`;

export const CounterTableHeader = styled.div`
  display: flex;
  padding: 12px 16px;
  background: rgba(115, 128, 148, 0.05);
  width: 1200px !important;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);

    &:first-child {
      width: 260px;
    }
    &:nth-child(2) {
      width: 160px;
    }
  }
`;

export const CounterTableRowWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f8f8f9;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;

    &:first-child {
      width: 260px;
    }
    &:nth-child(2) {
      width: 160px;
    }
  }
`;

export const CounterTableRowsWrapper = styled.div`
  max-height: 260px;
  overflow-y: auto;
  width: 1200px !important;
`;

export const ComparisonTableHeader = styled.div`
  display: flex;
  padding: 12px 16px;
  background: rgba(115, 128, 148, 0.05);
  width: 1200px !important;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);

    &:first-child {
      width: 107px;
    }
    &:nth-child(2) {
      width: 81px;
    }
    &:nth-child(3) {
      width: 110px;
    }
    &:nth-child(4) {
      width: 135px;
    }
    &:nth-child(5) {
      width: 79px;
    }
  }
`;

export const ComparisonTableRowWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f8f8f9;

  & > div {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;

    &:first-child {
      width: 107px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: var(--font-weight-semibold);
      font-size: 12px;
      line-height: 15px;
    }
    &:nth-child(2) {
      width: 81px;
    }
    &:nth-child(3) {
      width: 110px;
    }
    &:nth-child(4) {
      width: 135px;
    }
    &:nth-child(5) {
      width: 79px;
    }
  }
`;

export const ComparisonFiltersWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 12px;

  & > div {
    p {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      color: var(--color-text-muted);
      margin-bottom: 4px;
    }
    input {
      background: #f8f8f9;
      border-radius: 8px;
      border: none;
      padding: 8px 12px;
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 19px;
    }
  }

  button {
    background: rgba(0, 192, 153, 0.1);
    border-radius: 8px;
    padding: 8px 12px;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-primary);
    border: none;
  }
`;
