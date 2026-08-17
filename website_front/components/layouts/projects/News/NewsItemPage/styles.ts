import styled from "styled-components";
import Image from "next/image";
import Typography from "../../../../global/common/Typography";

export const ContentWrapper = styled.div`
  max-width: 68%;
  margin: 24px 0px 64px;

  h1 {
    max-width: 75%;
    font-size: 32px;
    font-weight: var(--font-weight-semibold);
    line-height: 39.2px;
    text-align: left;
  }

  @media (max-width: 767px) {
    width: 100%;
    max-width: 100%;
    margin: 0;
    h1 {
      max-width: 100%;
    }
  }
`;

export const Recommended = styled.div``;

export const RecommendedItemsWrapper = styled.div`
  width: 100%;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 16px;
  }
`;

export const RecommendedTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
  margin-top: 140px !important;
  margin-bottom: 40px !important;
  white-space: normal !important;

  @media (max-width: 768px) {
    margin: 0 !important;
    font-size: 20px;
    line-height: 24px;
  }
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

export const ImageStyles = styled(Image)`
  width: 580px;
  height: auto;
  margin-bottom: 24px;

  @media (max-width: 767px) {
    width: 100%;
  }
`;

export const NewsImage = styled.img`
  margin: 40px 0px 20px;
  width: 100%;
  min-height: 400px;
  border-radius: 12px;
  height: auto;
  margin-bottom: 24px;
  object-fit: cover;
  @media (max-width: 767px) {
    width: 100%;
    margin: 20px 0 16px;
    min-height: 200px;
  }
`;

export const ContentText = styled.div`
  color: var(--color-text-primary);

  p {
    margin-bottom: 40px;
    font-size: 16px;
    line-height: 21px;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 12px;
    margin-bottom: 12px;
    color: var(--color-text-primary);
  }

  @media (max-width: 767px) {
    font-size: 16px;
    line-height: 19px;

    p {
      margin-bottom: 20px;
      font-size: 14px;
      line-height: 18px;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: 8px;
      margin-bottom: 8px;
    }
  }
`;

export const LikesWrapper = styled.div`
  display: flex;
  justify-content: space-between;

  p {
    color: var(--color-text-muted);
    font-size: 16px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;

    p {
      font-size: 14px;
    }
  }
`;

export const LikesButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 45px;

  @media (max-width: 768px) {
    gap: 20px;
  }
`;

export const Details = styled.div`
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 20px;

  span {
    font-size: 16px;
    font-weight: var(--font-weight-regular);
    line-height: 19.2px;
    color: var(--color-text-muted);
  }

  & .blog-social a:last-child {
    opacity: 0.7;

    &:hover {
      opacity: 0.6;
    }
  }

  @media (max-width: 768px) {
    gap: 12px;
    flex-wrap: wrap;
  }
`;

export const Categories = styled.div`
  margin-left: auto;
`;
