import React from "react";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const SkeletonBlock = styled.div<{
  $width?: string;
  $height?: string;
  $radius?: string;
}>`
  width: ${({ $width = "100%" }) => $width};
  height: ${({ $height = "16px" }) => $height};
  max-width: 100%;
  flex-shrink: 0;
  border-radius: ${({ $radius = "8px" }) => $radius};
  background: linear-gradient(100deg, #edf1f5 30%, #f8fafc 48%, #edf1f5 66%);
  background-size: 240% 100%;
  animation: ${shimmer} 1.45s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ScreenReaderStatus = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const ListRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
  margin-top: 40px;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FeaturedSkeleton = styled.div`
  min-height: 200px;
  padding: 20px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
  border: 1px solid #e9f1f5;
  border-radius: 12px;
  background: #f9fcfd;
  box-shadow: 2px 2px 8px rgba(0, 5, 48, 0.06);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const FeaturedIdentity = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
`;

const SkeletonStack = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FeaturedLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
`;

const FeaturedStats = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const FeaturedRight = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 14px;
  border-radius: 10px;
  background: rgba(237, 245, 247, 0.72);
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 1120px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const ProjectSkeleton = styled.div`
  min-height: 280px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  border: 1px solid #edf0f4;
  border-radius: 12px;
  background: #fff;
  box-shadow: 2px 2px 8px rgba(0, 5, 48, 0.05);
`;

const ProjectHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProjectStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const StatSkeleton = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  border-radius: 8px;
  background: #f8fafb;
`;

const DetailRoot = styled.div`
  width: 100%;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

const BreadcrumbSkeleton = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DetailHeader = styled.div`
  min-height: 176px;
  padding: 24px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
  border: 1px solid #edf0f4;
  border-radius: 12px;
  background: #fff;
  box-shadow: 2px 2px 8px rgba(0, 5, 48, 0.05);

  @media (max-width: 640px) {
    padding: 18px;
  }
`;

const DetailColumns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  align-items: start;
  gap: 24px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const DetailColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const DetailCard = styled.div<{ $minHeight: string }>`
  min-height: ${({ $minHeight }) => $minHeight};
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  border: 1px solid #edf0f4;
  border-radius: 12px;
  background: #fff;
  box-shadow: 2px 2px 8px rgba(0, 5, 48, 0.05);
`;

const TimelineSkeleton = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 6px;
`;

const TimelineItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const TableRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 44px minmax(100px, 1fr) 90px;
  gap: 12px;
  align-items: center;
`;

const PROJECT_SKELETON_KEYS = ["project-1", "project-2", "project-3", "project-4", "project-5", "project-6"];
const TABLE_ROW_KEYS = ["row-1", "row-2", "row-3", "row-4"];

export const LaunchpadProjectsSkeleton: React.FC = () => (
  <ListRoot role="status" aria-live="polite" aria-busy="true">
    <ScreenReaderStatus>Loading launch projects</ScreenReaderStatus>
    <Section>
      <SkeletonBlock $width="190px" $height="30px" />
      <FeaturedSkeleton>
        <FeaturedLeft>
          <FeaturedIdentity>
            <SkeletonBlock $width="72px" $height="72px" $radius="50%" />
            <SkeletonStack>
              <SkeletonBlock $width="42%" $height="24px" />
              <SkeletonBlock $width="28%" $height="14px" />
              <SkeletonBlock $width="82%" $height="14px" />
              <SkeletonBlock $width="68%" $height="14px" />
            </SkeletonStack>
          </FeaturedIdentity>
          <FeaturedStats>
            <SkeletonBlock $width="150px" $height="28px" />
            <SkeletonBlock $width="130px" $height="28px" />
            <SkeletonBlock $width="120px" $height="28px" />
          </FeaturedStats>
        </FeaturedLeft>
        <FeaturedRight>
          <SkeletonBlock $width="42%" $height="14px" />
          <SkeletonBlock $height="10px" $radius="999px" />
        </FeaturedRight>
      </FeaturedSkeleton>
    </Section>

    <Section>
      <SkeletonBlock $width="145px" $height="30px" />
      <ProjectsGrid>
        {PROJECT_SKELETON_KEYS.map((key) => (
          <ProjectSkeleton key={key}>
            <ProjectHeader>
              <SkeletonBlock $width="52px" $height="52px" $radius="50%" />
              <SkeletonStack>
                <SkeletonBlock $width="58%" $height="20px" />
                <SkeletonBlock $width="40%" $height="13px" />
              </SkeletonStack>
            </ProjectHeader>
            <ProjectStats>
              <StatSkeleton>
                <SkeletonBlock $width="64%" $height="12px" />
                <SkeletonBlock $width="82%" $height="18px" />
              </StatSkeleton>
              <StatSkeleton>
                <SkeletonBlock $width="58%" $height="12px" />
                <SkeletonBlock $width="76%" $height="18px" />
              </StatSkeleton>
            </ProjectStats>
            <SkeletonStack>
              <SkeletonBlock $width="46%" $height="13px" />
              <SkeletonBlock $height="9px" $radius="999px" />
            </SkeletonStack>
            <SkeletonBlock $width="40%" $height="16px" />
          </ProjectSkeleton>
        ))}
      </ProjectsGrid>
    </Section>
  </ListRoot>
);

export const LaunchpadDetailSkeleton: React.FC = () => (
  <DetailRoot role="status" aria-live="polite" aria-busy="true">
    <ScreenReaderStatus>Loading launch details</ScreenReaderStatus>
    <BreadcrumbSkeleton>
      <SkeletonBlock $width="62px" $height="14px" />
      <SkeletonBlock $width="8px" $height="14px" />
      <SkeletonBlock $width="78px" $height="14px" />
      <SkeletonBlock $width="8px" $height="14px" />
      <SkeletonBlock $width="120px" $height="14px" />
    </BreadcrumbSkeleton>

    <DetailHeader>
      <SkeletonBlock $width="88px" $height="88px" $radius="50%" />
      <SkeletonStack>
        <SkeletonBlock $width="36%" $height="30px" />
        <SkeletonBlock $width="22%" $height="20px" $radius="999px" />
        <SkeletonBlock $width="76%" $height="14px" />
        <SkeletonBlock $width="62%" $height="14px" />
      </SkeletonStack>
    </DetailHeader>

    <DetailColumns>
      <DetailColumn>
        <DetailCard $minHeight="245px">
          <SkeletonBlock $width="180px" $height="24px" />
          <TimelineSkeleton>
            {["timeline-1", "timeline-2", "timeline-3"].map((key) => (
              <TimelineItem key={key}>
                <SkeletonBlock $width="44px" $height="44px" $radius="50%" />
                <SkeletonBlock $width="72%" $height="15px" />
                <SkeletonBlock $width="88%" $height="11px" />
              </TimelineItem>
            ))}
          </TimelineSkeleton>
        </DetailCard>
        <DetailCard $minHeight="430px">
          <SkeletonBlock $width="150px" $height="25px" />
          <SkeletonBlock $width="96%" $height="14px" />
          <SkeletonBlock $width="92%" $height="14px" />
          <SkeletonBlock $width="84%" $height="14px" />
          <TableRows>
            {TABLE_ROW_KEYS.map((key) => (
              <TableRow key={key}>
                <SkeletonBlock $height="34px" $radius="50%" />
                <SkeletonBlock $width="76%" $height="16px" />
                <SkeletonBlock $height="22px" $radius="999px" />
              </TableRow>
            ))}
          </TableRows>
        </DetailCard>
      </DetailColumn>

      <DetailColumn>
        <DetailCard $minHeight="250px">
          <SkeletonBlock $width="72%" $height="24px" />
          <ProjectStats>
            <StatSkeleton><SkeletonBlock $height="13px" /><SkeletonBlock $width="72%" $height="20px" /></StatSkeleton>
            <StatSkeleton><SkeletonBlock $height="13px" /><SkeletonBlock $width="72%" $height="20px" /></StatSkeleton>
          </ProjectStats>
          <SkeletonBlock $height="42px" $radius="10px" />
        </DetailCard>
        <DetailCard $minHeight="205px">
          <SkeletonBlock $width="58%" $height="24px" />
          <SkeletonBlock $width="82%" $height="14px" />
          <SkeletonBlock $height="54px" $radius="10px" />
          <SkeletonBlock $height="42px" $radius="10px" />
        </DetailCard>
        <DetailCard $minHeight="235px">
          <SkeletonBlock $width="52%" $height="24px" />
          {TABLE_ROW_KEYS.slice(0, 3).map((key) => (
            <ProjectHeader key={key}>
              <SkeletonBlock $width="36px" $height="36px" $radius="50%" />
              <SkeletonBlock $width="62%" $height="15px" />
            </ProjectHeader>
          ))}
        </DetailCard>
      </DetailColumn>
    </DetailColumns>
  </DetailRoot>
);
