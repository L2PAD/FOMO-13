import styled from "styled-components";
import Typography from "../../../global/common/Typography";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 32px auto;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const PageDescriptionWrapper = styled.div`
  margin-bottom: 24px;
`;

export const PageDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: normal !important;

  span {
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
  }
`;

export const ContentWrapper = styled.div`
  margin-top: 16px;

  .sort {
    display: flex;
    justify-content: flex-end;
  }
`;
