import styled from "styled-components";
import Typography from "../../../../../global/common/Typography";

export const Wrapper = styled.div`
  margin-top: 52px;

  .container {
    overflow-x: auto;
    padding: 5px;
  }
`;

export const NFTCardWrapper = styled.div`
  margin-top: 15px;
  width: 228px !important;

  & > div {
    width: 100% !important;
  }

  @media (max-width: 1204px) {
    width: 32% !important;
  }

  @media (max-width: 932px) {
    width: 48% !important;
  }

  @media (max-width: 631px) {
    width: 100% !important;
  }
`;

export const NFTsCardsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

export const PageTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);
`;

export const HeaderWrapper = styled.div`
  display: flex;
  margin-top: 14px;
  justify-content: space-between;
`;

export const ShowAllWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 18px;
`;

export const ShowAllButton = styled.button`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-primary);
  border: none;
  background: none;
`;

export const EmptyLabel = styled.div`
  margin-top: 22px;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
`;
