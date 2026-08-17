import React from "react";
import styled from "styled-components";
import { sanitizedHtml } from "../../../../../helpers/sanitizeHtml";

const CardWrapper = styled.div`
  width: 100%;
  background: #f5fbfd;
  border-radius: 16px;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
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
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #b5bcc7;
`;

const HighlightsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const HighlightItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 0;
  border-bottom: 1px solid #e5e9f2;

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const HighlightText = styled.p`
  font-size: 16px;
  color: #070b35;
  margin: 0;
  line-height: 1.5;

  strong {
    font-weight: var(--font-weight-semibold);
  }
`;

const HighlightDate = styled.div`
  font-size: 14px;
  color: #728094;
  text-align: right;
`;

interface Highlight {
  id: string;
  text: string;
  date: string;
}

interface RecentHighlightsProps {
  highlights: Highlight[];
}

const RecentHighlights: React.FC<RecentHighlightsProps> = ({ highlights }) => {
  return (
    <CardWrapper>
      <CardHeader>
        <CardTitle>Recent Highlights</CardTitle>
        <CardBadge>Preview Only</CardBadge>
      </CardHeader>

      <HighlightsList>
        {highlights.map((highlight) => (
          <HighlightItem key={highlight.id}>
            <HighlightText
              dangerouslySetInnerHTML={sanitizedHtml(highlight.text)}
            />
            <HighlightDate>{highlight.date}</HighlightDate>
          </HighlightItem>
        ))}
      </HighlightsList>
    </CardWrapper>
  );
};

export default RecentHighlights;
