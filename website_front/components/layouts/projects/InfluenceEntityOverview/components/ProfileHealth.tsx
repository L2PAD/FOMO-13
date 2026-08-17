import React from "react";
import styled from "styled-components";

const CardWrapper = styled.div<{ forCompare?: boolean }>`
  background: #f5fbfd;
  border-radius: 12px;
  padding: 20px;
  width: 100%;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const CardTitle = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0 0 8px 0;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const Subtitle = styled.p`
  font-size: 12px;
  color: #738094;
  margin: 0 0 20px 0;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
`;

const Label = styled.span`
  font-size: 14px;
  color: #070b35;
  min-width: max-content;
`;

const Value = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  text-align: right;
`;

const MetricSection = styled.div`
  background: #e9f8f8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;

  &:last-of-type {
    margin-bottom: 16px;
  }
`;

const MetricLabel = styled.div`
  font-size: 14px;
  color: #738094;
  margin-bottom: 8px;
`;

const MetricValue = styled.div`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin-bottom: 8px;
  line-height: 1;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const MetricDescription = styled.div`
  font-size: 12px;
  color: #05a584;
`;

const FooterNote = styled.p`
  font-size: 12px;
  color: #738094;
  line-height: 1.6;
  margin: 0;
`;

interface ProfileHealthProps {
  profileCompleteness?: {
    value: string;
    description: string;
  };
  growthPattern?: {
    value: string;
    description: string;
  };
  engagementQuality?: {
    value: string;
    description: string;
  };
  footerNote?: string;
  forCompare?: boolean;
}

const ProfileHealth: React.FC<ProfileHealthProps> = ({
  profileCompleteness = {
    value: "Excellent",
    description: "Rich headline • detailed experience",
  },
  growthPattern = {
    value: "Organic",
    description: "Steady follower curve",
  },
  engagementQuality = {
    value: "High",
    description: 'Low pod/"great post" noise',
  },
  footerNote = "Health indicators are derived from profile structure, posting history and how diverse commenters are across recent posts. Exact LinkedIn trust scores are not available, so this block should be read as a qualitative guide rather than a hard rating.",
  forCompare = false,
}) => {
  if (forCompare) {
    return (
      <CardWrapper forCompare={forCompare}>
        <Row
          style={{
            marginBottom: "20px",
          }}
        >
          <Label>Profile Completeness</Label>
          <Value>{profileCompleteness.value}</Value>
        </Row>
        <Row
          style={{
            marginBottom: "20px",
          }}
        >
          <Label>Growth pattern</Label>
          <Value>{growthPattern.value}</Value>
        </Row>
        <Row>
          <Label>Engagement quality</Label>
          <Value>{engagementQuality.value}</Value>
        </Row>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper forCompare={forCompare}>
      <CardTitle>Profile Health</CardTitle>
      <Subtitle>
        High-level assessment of completeness, growth pattern and engagement
        quality.
      </Subtitle>

      <MetricSection>
        <MetricLabel>Profile Completeness</MetricLabel>
        <MetricValue>{profileCompleteness.value}</MetricValue>
        <MetricDescription>{profileCompleteness.description}</MetricDescription>
      </MetricSection>

      <MetricSection>
        <MetricLabel>Growth pattern</MetricLabel>
        <MetricValue>{growthPattern.value}</MetricValue>
        <MetricDescription>{growthPattern.description}</MetricDescription>
      </MetricSection>

      <MetricSection>
        <MetricLabel>Engagement quality</MetricLabel>
        <MetricValue>{engagementQuality.value}</MetricValue>
        <MetricDescription>{engagementQuality.description}</MetricDescription>
      </MetricSection>

      {!forCompare && <FooterNote>{footerNote}</FooterNote>}
    </CardWrapper>
  );
};

export default ProfileHealth;
