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

// ─────────────── NEWS-1 Phase 6A: AI-generated rich sections ───────────────
export const AiBadge = styled.div<{ trust?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary, #04a584);
  background: rgba(4, 165, 132, 0.08);
  border: 1px solid rgba(4, 165, 132, 0.24);
  margin-bottom: 20px;

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ trust }) =>
      trust === "RED"
        ? "#DC2626"
        : trust === "YELLOW"
        ? "#D97706"
        : "#04A584"};
  }
`;

export const SectionHeading = styled.div`
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 26px;
  color: var(--color-text-primary);
  margin: 36px 0 14px;

  @media (max-width: 767px) {
    font-size: 17px;
    margin: 28px 0 10px;
  }
`;

export const SummaryText = styled.div`
  font-size: 18px;
  line-height: 28px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  padding: 18px 20px;
  border-radius: 12px;
  background: rgba(7, 11, 53, 0.03);
  border-left: 3px solid var(--color-primary, #04a584);

  @media (max-width: 767px) {
    font-size: 16px;
    line-height: 24px;
    padding: 14px 16px;
  }
`;

export const TakeawaysList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;

  li {
    position: relative;
    padding-left: 28px;
    font-size: 16px;
    line-height: 24px;
    color: var(--color-text-primary);
  }

  li::before {
    content: "";
    position: absolute;
    left: 4px;
    top: 9px;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: var(--color-primary, #04a584);
  }
`;

export const AiViewBox = styled.div`
  padding: 20px 22px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    rgba(4, 165, 132, 0.06) 0%,
    rgba(4, 165, 132, 0.02) 100%
  );
  border: 1px solid rgba(4, 165, 132, 0.2);
  font-size: 16px;
  line-height: 25px;
  color: var(--color-text-primary);

  @media (max-width: 767px) {
    padding: 16px 18px;
    font-size: 15px;
  }
`;

export const WhyMattersBox = styled.div`
  padding: 18px 20px;
  border-radius: 12px;
  background: rgba(7, 11, 53, 0.03);
  font-size: 16px;
  line-height: 25px;
  color: var(--color-text-primary);
`;

export const SourcesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  a {
    font-size: 14px;
    line-height: 20px;
    color: var(--color-primary, #04a584);
    text-decoration: none;
    word-break: break-all;
    display: inline-flex;
    align-items: baseline;
    gap: 8px;

    &:hover {
      text-decoration: underline;
    }

    span {
      color: rgba(7, 11, 53, 0.5);
      font-weight: var(--font-weight-semibold);
      min-width: 22px;
    }
  }
`;

