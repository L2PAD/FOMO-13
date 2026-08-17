import React, { FC } from "react";
import styled, { keyframes } from "styled-components";
import { PageWrapper } from "../../../CryptoMarket/styles";

const shimmer = keyframes`
  0% { background-position: 180% 0; }
  100% { background-position: -180% 0; }
`;

const enter = keyframes`
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
`;

const LoadingPage = styled(PageWrapper)`
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: ${enter} 220ms ease-out both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const LoadingGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  align-items: start;
  gap: 20px;

  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Stack = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Panel = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  background: var(--color-white);
  box-shadow: 2px 2px 8px rgba(0, 5, 48, 0.08);

  @media (max-width: 600px) {
    gap: 16px;
    padding: 16px;
  }
`;

const Bone = styled.span<{
  $width?: string;
  $height?: string;
  $radius?: string;
}>`
  display: block;
  width: ${({ $width }) => $width || "100%"};
  max-width: 100%;
  height: ${({ $height }) => $height || "14px"};
  flex: 0 0 auto;
  border-radius: ${({ $radius }) => $radius || "6px"};
  background: linear-gradient(90deg, #eef1f4 15%, #f8fafb 45%, #eef1f4 75%);
  background-size: 220% 100%;
  animation: ${shimmer} 1.35s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Hero = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

const Identity = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const IdentityText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
`;

const ActionBones = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;

  @media (max-width: 600px) {
    display: none;
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  padding: 14px;
  border-radius: 10px;
  background: var(--color-surface-subtle);

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StatBone = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
`;

const ScreenReaderText = styled.span`
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

const ActivityDetailsLoading: FC = () => (
  <LoadingPage role="status" aria-live="polite" aria-busy="true">
    <ScreenReaderText>Loading activity details</ScreenReaderText>
    <LoadingGrid aria-hidden="true">
      <Stack>
        <Panel>
          <Hero>
            <Identity>
              <Bone $width="72px" $height="72px" $radius="50%" />
              <IdentityText>
                <Bone $width="210px" $height="28px" />
                <Bone $width="132px" $height="18px" />
              </IdentityText>
            </Identity>
            <ActionBones>
              {Array.from({ length: 4 }, (_, index) => (
                <Bone
                  key={`activity-action-${index}`}
                  $width="34px"
                  $height="34px"
                  $radius="50%"
                />
              ))}
            </ActionBones>
          </Hero>
          <StatGrid>
            {Array.from({ length: 5 }, (_, index) => (
              <StatBone key={`activity-stat-${index}`}>
                <Bone $width="64px" $height="11px" />
                <Bone $width="88%" $height="16px" />
              </StatBone>
            ))}
          </StatGrid>
          <TextBlock>
            <Bone $width="190px" $height="13px" />
            <Bone $height="8px" $radius="999px" />
          </TextBlock>
        </Panel>

        <Panel>
          <Bone $width="92px" $height="22px" />
          <TextBlock>
            <Bone />
            <Bone />
            <Bone $width="82%" />
            <Bone $width="68%" />
          </TextBlock>
          <ScoreGrid>
            <Bone $height="58px" $radius="10px" />
            <Bone $height="58px" $radius="10px" />
          </ScoreGrid>
        </Panel>

        <Panel>
          <Bone $width="220px" $height="22px" />
          <TextBlock>
            <Bone />
            <Bone $width="74%" />
          </TextBlock>
          <Bone $height="84px" $radius="10px" />
          <Bone $height="84px" $radius="10px" />
        </Panel>
      </Stack>

      <Stack>
        <Panel>
          <Bone $width="152px" $height="22px" />
          {Array.from({ length: 4 }, (_, index) => (
            <StatBone key={`activity-metric-${index}`}>
              <Bone $width="46%" $height="12px" />
              <Bone $width="72%" $height="18px" />
            </StatBone>
          ))}
        </Panel>
        <Panel>
          <Bone $width="126px" $height="22px" />
          <Bone $height="56px" $radius="10px" />
          <Bone $height="56px" $radius="10px" />
          <Bone $height="56px" $radius="10px" />
        </Panel>
      </Stack>
    </LoadingGrid>
  </LoadingPage>
);

export default ActivityDetailsLoading;
