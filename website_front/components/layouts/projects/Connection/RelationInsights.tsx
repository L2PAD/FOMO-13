import React from "react";
import styled from "styled-components";

const InsightsWrapper = styled.div`
  border-radius: 12px;
  min-width: 300px;

  @media (max-width: 1024px) {
    min-width: 250px;
  }

  @media (max-width: 768px) {
    min-width: 100%;
  }
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0 0 24px 0;

  @media (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 20px;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 32px;
  min-width: 400px;

  @media (max-width: 768px) {
    gap: 12px;
    margin-bottom: 24px;
    min-width: 100%;
  }
`;

const MetricCard = styled.div`
  background: #f5fbfd;
  border-radius: 8px;
  padding: 10px;

  @media (max-width: 768px) {
    padding: 6px;
  }
`;

const MetricLabel = styled.div`
  font-size: 14px;
  color: #738094;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 12px;
    margin-bottom: 6px;
  }
`;

const MetricValue = styled.div`
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  color: #04a584;
  margin-bottom: 4px;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const MetricSubtext = styled.div`
  font-size: 14px;
  color: #738094;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 12px;
    margin-bottom: 6px;
  }
`;

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f5fbfd;
  border-radius: 8px;
  padding: 20px;

  @media (max-width: 768px) {
    gap: 10px;
    padding: 12px;
  }
`;

const CategoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CategoryName = styled.div`
  font-size: 14px;
  color: #070b35;
  font-weight: var(--font-weight-regular);

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const CategoryCount = styled.div`
  font-size: 16px;
  color: #070b35;
  font-weight: var(--font-weight-semibold);

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

interface RelationInsightsProps {
  totalRelations: number;
  activeRelations: number;
  networkHops: number;
  reachableEntities: number;
  personsCount: number;
  fundsCount: number;
  projectsCount: number;
}

const RelationInsights: React.FC<RelationInsightsProps> = ({
  totalRelations,
  activeRelations,
  networkHops,
  reachableEntities,
  personsCount,
  fundsCount,
  projectsCount,
}) => {
  return (
    <InsightsWrapper>
      <Title>Relation Insights</Title>

      <MetricsGrid>
        <MetricCard>
          <MetricLabel>Total relations</MetricLabel>
          <MetricValue>{totalRelations}</MetricValue>
          <MetricSubtext>{activeRelations} active</MetricSubtext>
        </MetricCard>

        <MetricCard>
          <MetricLabel>Network reach</MetricLabel>
          <MetricValue>{networkHops - 1} hops</MetricValue>
          <MetricSubtext>can reach {reachableEntities} entities</MetricSubtext>
        </MetricCard>
      </MetricsGrid>

      <CategoryList>
        <CategoryItem>
          <CategoryName>Persons</CategoryName>
          <CategoryCount>{personsCount}</CategoryCount>
        </CategoryItem>

        <CategoryItem>
          <CategoryName>Funds</CategoryName>
          <CategoryCount>{fundsCount}</CategoryCount>
        </CategoryItem>

        <CategoryItem>
          <CategoryName>Projects</CategoryName>
          <CategoryCount>{projectsCount}</CategoryCount>
        </CategoryItem>
      </CategoryList>
    </InsightsWrapper>
  );
};

export default RelationInsights;
