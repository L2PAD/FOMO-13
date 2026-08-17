import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";
import Typography from "../../../../../global/common/Typography";

export const ScrollWrapper = styled.div`
  width: calc(100% - (100% - 1204px) / 2);
  margin-left: calc((100% - 1204px) / 2);
  display: flex;
  overflow-x: auto;
  gap: 16px;

  @media (max-width: 1024px) {
    width: 100%;
    padding: 0 0 0 16px;
    margin-left: 0;
  }
`;

export const ContentWrapper = styled.div`
  width: 1204px;
  margin: 30px auto 0;
`;

export const RoundWrapper = styled(BaseCard)`
  min-width: 360px !important;
`;

export const RoundTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-primary);
`;

export const RoundValueWrapper = styled.div`
  display: flex;
  margin-top: 10px;

  p {
    width: 50%;
    white-space: normal !important;
  }
`;

export const RoundValue = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);

  span {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;

export const TableWrapper = styled.div`
  margin-top: 32px;
`;
