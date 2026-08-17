import React from "react";
import styled from "styled-components";

const CardWrapper = styled.div<{ forCompare?: boolean; empty?: boolean }>`
  background: #f5fbfd;
  border-radius: 20px;
  padding: 20px;
  display: ${({ forCompare, empty }) =>
    forCompare && empty ? "flex" : "block"};
  align-items: ${({ forCompare, empty }) =>
    forCompare && empty ? "center" : "normal"};
  justify-content: ${({ forCompare, empty }) =>
    forCompare && empty ? "center" : "normal"};
  min-height: ${({ forCompare, empty }) =>
    forCompare && empty ? "360px" : "auto"};

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: #738094;
  text-align: center;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const CardTitle = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const CardBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #728094;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #b5bcc7;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #738094;
  margin: 0 0 24px 0;
`;

const ProductTypeSection = styled.div<{ forCompare?: boolean }>`
  margin-bottom: ${({ forCompare }) => (forCompare ? "12px" : "20px")};
`;

const ProductTypeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const ProductTypeLabel = styled.span`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const RatingWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StarsWrapper = styled.div`
  display: flex;
  gap: 2px;
`;

const RatingValue = styled.span`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.span`
  padding: 4px 8px;
  font-size: 12px;
  color: #05a584;
  background: #e9f8f8;
  border-radius: 6px;
`;

const FeedbackSection = styled.div<{ forCompare?: boolean }>`
  margin-bottom: ${({ forCompare }) => (forCompare ? "12px" : "20px")};
`;

const FeedbackTitle = styled.h4`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0 0 10px 0;
`;

const FeedbackText = styled.p`
  font-size: 14px;
  line-height: 1.2;
  color: #070b35;
`;

const TrustSection = styled.div<{ forCompare?: boolean }>`
  margin-bottom: ${({ forCompare }) => (forCompare ? "12px" : "20px")};
`;

const TrustList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TrustItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  line-height: 1.2;
  color: #070b35;

  &::before {
    content: "•";
    color: #070b35;
    font-weight: var(--font-weight-semibold);
  }
`;

const RefundRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RefundLabel = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const RefundValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill={filled ? "#FFC700" : "none"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 1.66667L12.575 6.88334L18.3333 7.725L14.1667 11.7833L15.15 17.5167L10 14.8083L4.85 17.5167L5.83333 11.7833L1.66667 7.725L7.425 6.88334L10 1.66667Z"
      stroke="#FFC700"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface ProductOverviewProps {
  rating?: number;
  maxRating?: number;
  tags?: string[];
  feedbackSummary?: string;
  trustIndicators?: string[];
  refundRate?: string;
  forCompare?: boolean;
  empty?: boolean;
}

const ProductOverview: React.FC<ProductOverviewProps> = ({
  rating = 4.4,
  maxRating = 5,
  tags = ["Courses", "Private community", "Signals & research"],
  feedbackSummary = "Users highlight clear market insights, accurate early alerts, and strong educational value. Criticism mostly concerns delayed updates during high-volatility periods and limited beginner-friendly material.",
  trustIndicators = [
    "High retention of paid members",
    "Stable positive vs negative sentiment",
    "Low spam & minimal bot-like reviews",
    "Content reshared by reputable analysts",
  ],
  refundRate = "~3% over 30 days",
  forCompare = false,
  empty = false,
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  if (forCompare && empty) {
    return (
      <CardWrapper forCompare={forCompare} empty={empty}>
        <EmptyText>
          This account currently has no product associated with it.
        </EmptyText>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper forCompare={forCompare}>
      {!forCompare && (
        <CardHeader>
          <CardTitle>Product Overview</CardTitle>
          <CardBadge>User-Rated • Last 30D</CardBadge>
        </CardHeader>
      )}
      {!forCompare && (
        <Subtitle>
          User feedback and trust signals for associated products.
        </Subtitle>
      )}

      <ProductTypeSection forCompare={forCompare}>
        <ProductTypeHeader>
          <ProductTypeLabel>Product type</ProductTypeLabel>
          <RatingWrapper>
            <StarsWrapper>
              {[...Array(fullStars)].map((_, i) => (
                <StarIcon key={`full-${i}`} filled />
              ))}
              {hasHalfStar && <StarIcon filled />}
              {[...Array(emptyStars)].map((_, i) => (
                <StarIcon key={`empty-${i}`} filled={false} />
              ))}
            </StarsWrapper>
            <RatingValue>
              {rating}/{maxRating}
            </RatingValue>
          </RatingWrapper>
        </ProductTypeHeader>
        <TagsList>
          {tags.map((tag, index) => (
            <Tag key={index}>{tag}</Tag>
          ))}
        </TagsList>
      </ProductTypeSection>

      <FeedbackSection forCompare={forCompare}>
        <FeedbackTitle>User feedback summary</FeedbackTitle>
        <FeedbackText>{feedbackSummary}</FeedbackText>
      </FeedbackSection>

      <TrustSection forCompare={forCompare}>
        <FeedbackTitle>Trust indicators</FeedbackTitle>
        <TrustList>
          {trustIndicators.map((indicator, index) => (
            <TrustItem key={index}>{indicator}</TrustItem>
          ))}
        </TrustList>
      </TrustSection>

      <RefundRow>
        <RefundLabel>Refund & complaint rate</RefundLabel>
        <RefundValue>{refundRate}</RefundValue>
      </RefundRow>
    </CardWrapper>
  );
};

export default ProductOverview;
