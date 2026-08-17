import styled from "styled-components";
import Image from "next/image";
import Typography from "../../../../global/common/Typography";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 27px auto;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const ContentWrapper = styled.div`
  width: 580px;
  margin: 24px auto 64px;

  @media (max-width: 767px) {
    width: 100%;
  }
`;

export const RecommendedItemsWrapper = styled.div`
  display: flex;
  gap: 23px;
  flex-wrap: wrap;
`;

export const RecommendedTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);
  margin-bottom: 8px !important;
  white-space: normal !important;
`;

export const Date = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: rgba(7, 11, 53, 0.5);
  margin-bottom: 8px !important;

  @media (max-width: 767px) {
    font-size: 12px;
    line-height: 15px;
  }
`;

export const Title = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 48px;
  line-height: 58px;
  color: #0d0f2b;
  margin-bottom: 18px !important;
  white-space: normal !important;

  @media (max-width: 767px) {
    font-size: 32px;
    line-height: 39px;
  }
`;

export const ImageStyle = styled(Image)`
  width: 580px;
  margin-bottom: 24px;

  @media (max-width: 767px) {
    width: 100%;
  }
`;

export const ContentText = styled.div`
  color: var(--color-text-primary);

  p {
    margin-bottom: 20px;
    font-size: 18px;
    line-height: 21px;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 20px;
    margin-bottom: 20px;
    color: var(--color-text-primary);
  }

  @media (max-width: 767px) {
    font-size: 16px;
    line-height: 19px;
  }
`;
