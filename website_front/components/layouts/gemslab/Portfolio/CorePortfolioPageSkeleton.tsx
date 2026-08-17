import React from "react";
import styled, { css, keyframes } from "styled-components";
import { mainGlobalDark } from "../../../../styles/mainGlobalDark";
import { PageWrapper } from "../../projects/CryptoMarket/styles";

const shimmer = keyframes`
  0% {
    transform: translate3d(-120%, 0, 0);
  }

  55%,
  100% {
    transform: translate3d(220%, 0, 0);
  }
`;

const drawChartLine = keyframes`
  0% {
    opacity: 0.6;
    stroke-dashoffset: 760;
  }

  55%,
  100% {
    opacity: 1;
    stroke-dashoffset: 0;
  }
`;

const CoreSkeletonPage = styled(PageWrapper)`
  --portfolio-skeleton-border: #f0f2f5;
  --portfolio-skeleton-shadow: 2px 2px 8px rgba(0, 5, 48, 0.06);

  width: 100%;
  min-width: 0;
  padding-top: 20px;
  padding-bottom: 40px;

  @media (max-width: 1204px) {
    padding-top: 14px;
    padding-bottom: 32px;
  }

  @media (max-width: 768px) {
    padding-top: 12px;
    padding-bottom: 24px;
  }
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

type SkeletonTone = "light" | "dark" | "accent";

const SkeletonBlock = styled.span<{
  $width?: string;
  $height?: string;
  $radius?: string;
  $tone?: SkeletonTone;
}>`
  position: relative;
  display: block;
  width: ${({ $width }) => $width || "100%"};
  max-width: 100%;
  height: ${({ $height }) => $height || "12px"};
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: ${({ $radius }) => $radius || "999px"};
  background: ${({ $tone = "light" }) => {
    if ($tone === "dark") return "rgba(255, 255, 255, 0.09)";
    if ($tone === "accent") return "rgba(0, 221, 115, 0.15)";
    return "rgba(12, 26, 43, 0.075)";
  }};

  &::after {
    position: absolute;
    inset: 0;
    content: "";
    transform: translate3d(-120%, 0, 0);
    background: ${({ $tone = "light" }) => {
      if ($tone === "dark") {
        return "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)";
      }
      if ($tone === "accent") {
        return "linear-gradient(90deg, transparent, rgba(0, 221, 115, 0.18), transparent)";
      }
      return "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent)";
    }};
    animation: ${shimmer} 1.9s ease-in-out infinite;
    will-change: transform;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
      transform: none;
      opacity: 0.25;
    }
  }
`;

const Surface = css`
  min-width: 0;
  border: 1px solid var(--portfolio-skeleton-border);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: var(--portfolio-skeleton-shadow);
`;

const CommandHeader = styled.section`
  ${Surface};
  min-height: 62px;
  padding: 11px 14px 11px 18px;
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 820px) {
    align-items: stretch;
    flex-wrap: wrap;
    gap: 10px 14px;
    padding: 14px;
  }

  @media (max-width: 520px) {
    border-radius: 14px;
  }
`;

const CommandTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  margin-right: auto;
`;

const CommandInfo = styled.div`
  width: 18px;
  height: 18px;
  border: 1px solid rgba(12, 26, 43, 0.1);
  border-radius: 50%;
  background: rgba(12, 26, 43, 0.035);
`;

const CommandActions = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;

  @media (max-width: 820px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

const CommandInput = styled.div`
  width: clamp(180px, 22vw, 280px);
  height: 38px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid rgba(12, 26, 43, 0.07);
  border-radius: 9px;
  background: #f8f9fb;

  &::before {
    width: 12px;
    height: 12px;
    flex: 0 0 12px;
    content: "";
    border: 1.5px solid rgba(12, 26, 43, 0.2);
    border-radius: 50%;
  }

  @media (max-width: 820px) {
    width: auto;
    flex: 1 1 190px;
  }
`;

const CommandSelect = styled.div`
  width: 166px;
  height: 38px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(12, 26, 43, 0.08);
  border-radius: 9px;
  background: #ffffff;

  &::after {
    width: 6px;
    height: 6px;
    content: "";
    border-right: 1.5px solid rgba(12, 26, 43, 0.2);
    border-bottom: 1.5px solid rgba(12, 26, 43, 0.2);
    transform: rotate(45deg) translateY(-2px);
  }

  @media (max-width: 620px) {
    display: none;
  }
`;

const CommandButton = styled.div`
  width: 126px;
  height: 38px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: ${mainGlobalDark.background};

  @media (max-width: 420px) {
    width: 44px;
    padding: 0 10px;

    ${SkeletonBlock} {
      width: 18px;
    }
  }
`;

const Hero = styled.section`
  position: relative;
  isolation: isolate;
  min-height: 0;
  margin-top: 16px;
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(420px, 2fr);
  overflow: hidden;
  border: 1px solid ${mainGlobalDark.border};
  border-radius: 14px;
  background: ${mainGlobalDark.background};
  box-shadow: 2px 2px 10px rgba(0, 5, 48, 0.12);

  &::before {
    position: absolute;
    z-index: -1;
    top: -96px;
    right: -80px;
    width: 360px;
    height: 260px;
    content: "";
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(0, 221, 115, 0.07) 0%,
      rgba(0, 221, 115, 0) 68%
    );
  }

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 768px) {
    margin-top: 14px;
  }

  @media (max-width: 520px) {
    border-radius: 14px;
  }
`;

const HeroTop = styled.div`
  min-width: 0;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  @media (max-width: 520px) {
    padding: 15px;
  }
`;

const HeroIdentity = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const HeroAvatar = styled.div`
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 13px;
  background: ${mainGlobalDark.backgroundHover};

  ${SkeletonBlock} {
    margin: 11px;
  }
`;

const HeroCopy = styled.div`
  min-width: 0;
  padding-top: 2px;
  display: grid;
  gap: 6px;
`;

const HeroMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeroActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 520px) {
    ${SkeletonBlock}:first-child {
      display: none;
    }
  }
`;

const HeroMetrics = styled.div`
  min-width: 0;
  padding: 14px 16px;
  display: grid;
  grid-template-columns: minmax(145px, 0.9fr) repeat(2, minmax(90px, 1fr));
  align-items: center;
  gap: 6px;
  border-left: 1px solid ${mainGlobalDark.border};
  background: rgba(19, 36, 57, 0.62);

  @media (max-width: 960px) {
    border-top: 1px solid ${mainGlobalDark.border};
    border-left: 0;
  }

  @media (max-width: 520px) {
    padding: 15px;
    grid-template-columns: 1fr;
  }
`;

const HeroMetric = styled.div<{ $primary?: boolean }>`
  min-height: 54px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 7px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.035);
`;

const AnalyticsGrid = styled.section`
  margin-top: 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  align-items: stretch;

  @media (max-width: 1040px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 768px) {
    margin-top: 14px;
    gap: 14px;
  }
`;

const ChartCard = styled.div`
  ${Surface};
  min-height: 650px;
  padding: 18px;

  @media (max-width: 768px) {
    min-height: 620px;
    padding: 16px;
  }

  @media (max-width: 520px) {
    min-height: 590px;
    border-radius: 14px;
  }
`;

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 620px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const ChartControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 620px) {
    width: 100%;
    overflow: hidden;
  }
`;

const ChartControl = styled.div<{ $active?: boolean }>`
  width: ${({ $active }) => ($active ? "62px" : "44px")};
  height: 30px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid
    ${({ $active }) =>
      $active ? mainGlobalDark.background : "rgba(12, 26, 43, 0.08)"};
  border-radius: 8px;
  background: ${({ $active }) =>
    $active ? mainGlobalDark.background : "#f8f9fb"};
`;

const ChartValue = styled.div`
  margin-top: 20px;
  display: flex;
  align-items: flex-end;
  gap: 10px;
`;

const ChartCanvas = styled.div`
  position: relative;
  height: 348px;
  margin-top: 16px;
  overflow: hidden;
  border-radius: 10px;
  background-image:
    linear-gradient(to right, rgba(12, 26, 43, 0.055) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(12, 26, 43, 0.055) 1px, transparent 1px);
  background-size:
    25% 100%,
    100% 25%;

  svg {
    position: absolute;
    inset: 17px 10px 20px 8px;
    width: calc(100% - 18px);
    height: calc(100% - 37px);
    overflow: visible;
  }

  .core-portfolio-skeleton-area {
    opacity: 0.09;
  }

  .core-portfolio-skeleton-line {
    fill: none;
    stroke: ${mainGlobalDark.background};
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 760;
    stroke-dashoffset: 760;
    animation: ${drawChartLine} 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  }

  @media (max-width: 768px) {
    height: 310px;
  }

  @media (max-width: 520px) {
    height: 190px;
  }

  @media (prefers-reduced-motion: reduce) {
    .core-portfolio-skeleton-line {
      animation: none;
      stroke-dashoffset: 0;
    }
  }
`;

const ChartRange = styled.div`
  height: 28px;
  margin-top: 10px;
  padding: 7px 10px;
  overflow: hidden;
  border: 1px solid rgba(12, 26, 43, 0.07);
  border-radius: 8px;
  background: rgba(12, 26, 43, 0.025);

  &::before {
    display: block;
    width: 68%;
    height: 100%;
    margin-left: 8%;
    content: "";
    border-radius: 999px;
    background: rgba(12, 26, 43, 0.09);
  }
`;

const KpiRail = styled.aside`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  @media (max-width: 1040px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 660px) {
    grid-template-columns: 1fr;
  }
`;

const KpiCard = styled.div`
  ${Surface};
  min-height: 110px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 15px;

  @media (max-width: 520px) {
    min-height: 104px;
    padding: 14px;
    border-radius: 14px;
  }
`;

const KpiTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const KpiIcon = styled.div`
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border-radius: 8px;
  background: rgba(12, 26, 43, 0.055);
`;

const SectionCard = styled.section`
  ${Surface};
  margin-top: 32px;
  overflow: hidden;

  @media (max-width: 768px) {
    margin-top: 24px;
  }

  @media (max-width: 520px) {
    border-radius: 14px;
  }
`;

const SectionHeader = styled.div`
  min-height: 64px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--portfolio-skeleton-border);

  @media (max-width: 520px) {
    min-height: 58px;
    padding: 14px;
  }
`;

const TableHeader = styled.div`
  min-height: 42px;
  padding: 0 18px;
  display: grid;
  grid-template-columns: minmax(180px, 1.4fr) repeat(4, minmax(96px, 0.8fr));
  align-items: center;
  gap: 16px;
  background: #fafbfc;

  @media (max-width: 760px) {
    grid-template-columns: minmax(150px, 1.3fr) repeat(2, minmax(80px, 0.7fr));

    > :nth-child(3),
    > :nth-child(5) {
      display: none;
    }
  }

  @media (max-width: 520px) {
    padding: 0 14px;
    grid-template-columns: minmax(130px, 1.3fr) minmax(72px, 0.7fr);

    > :nth-child(2) {
      display: none;
    }
  }
`;

const TableRow = styled.div`
  min-height: 68px;
  padding: 0 18px;
  display: grid;
  grid-template-columns: minmax(180px, 1.4fr) repeat(4, minmax(96px, 0.8fr));
  align-items: center;
  gap: 16px;
  border-top: 1px solid var(--portfolio-skeleton-border);

  &:first-child {
    border-top: none;
  }

  @media (max-width: 760px) {
    grid-template-columns: minmax(150px, 1.3fr) repeat(2, minmax(80px, 0.7fr));

    > :nth-child(3),
    > :nth-child(5) {
      display: none;
    }
  }

  @media (max-width: 520px) {
    min-height: 64px;
    padding: 0 14px;
    grid-template-columns: minmax(130px, 1.3fr) minmax(72px, 0.7fr);

    > :nth-child(2) {
      display: none;
    }
  }
`;

const AssetCell = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 11px;
`;

const AssetIcon = styled.div`
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 50%;
  background: rgba(12, 26, 43, 0.07);
`;

const AssetCopy = styled.div`
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 7px;
`;

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 0.78fr) minmax(0, 1.22fr);
  gap: 16px;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const AllocationBody = styled.div`
  min-height: 286px;
  padding: 22px;
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  align-items: center;
  gap: 28px;

  @media (max-width: 440px) {
    min-height: 270px;
    padding: 18px;
    grid-template-columns: 116px minmax(0, 1fr);
    gap: 18px;
  }
`;

const AllocationRing = styled.div`
  position: relative;
  width: 150px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(
    rgba(12, 26, 43, 0.15) 0 41%,
    rgba(0, 221, 115, 0.13) 41% 68%,
    rgba(12, 26, 43, 0.08) 68% 100%
  );

  &::after {
    position: absolute;
    inset: 28px;
    content: "";
    border-radius: 50%;
    background: #ffffff;
  }

  @media (max-width: 440px) {
    width: 116px;

    &::after {
      inset: 22px;
    }
  }
`;

const AllocationLegend = styled.div`
  display: grid;
  gap: 17px;
`;

const LegendRow = styled.div`
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 9px;

  &::before {
    width: 8px;
    height: 8px;
    content: "";
    border-radius: 50%;
    background: rgba(12, 26, 43, 0.14);
  }
`;

const TransactionList = styled.div`
  min-height: 286px;
`;

const TransactionRow = styled.div`
  min-height: 71px;
  padding: 0 18px;
  display: grid;
  grid-template-columns: minmax(150px, 1fr) minmax(88px, 0.55fr) minmax(
      110px,
      0.65fr
    );
  align-items: center;
  gap: 16px;
  border-top: 1px solid var(--portfolio-skeleton-border);

  &:first-child {
    border-top: none;
  }

  @media (max-width: 520px) {
    min-height: 66px;
    padding: 0 14px;
    grid-template-columns: minmax(140px, 1fr) minmax(78px, 0.55fr);

    > :nth-child(2) {
      display: none;
    }
  }
`;

const TransactionAsset = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const HOLDING_ROWS = [0, 1, 2, 3, 4];
const KPI_CARDS = [0, 1, 2];
const LEGEND_ROWS = [0, 1, 2, 3];
const TRANSACTION_ROWS = [0, 1, 2, 3];

const CorePortfolioPageSkeleton: React.FC = () => (
  <CoreSkeletonPage role="status" aria-live="polite" aria-busy="true">
    <ScreenReaderText>Loading portfolio</ScreenReaderText>

    <div aria-hidden="true">
      <CommandHeader>
        <CommandTitle>
          <SkeletonBlock $width="118px" $height="25px" $radius="7px" />
          <CommandInfo />
        </CommandTitle>

        <CommandActions>
          <CommandInput>
            <SkeletonBlock $width="112px" $height="10px" />
          </CommandInput>
          <CommandSelect>
            <SkeletonBlock $width="96px" $height="10px" />
          </CommandSelect>
          <CommandButton>
            <SkeletonBlock $width="82px" $height="10px" $tone="dark" />
          </CommandButton>
        </CommandActions>
      </CommandHeader>

      <Hero>
        <HeroTop>
          <HeroIdentity>
            <HeroAvatar>
              <SkeletonBlock
                $width="26px"
                $height="26px"
                $radius="8px"
                $tone="dark"
              />
            </HeroAvatar>
            <HeroCopy>
              <SkeletonBlock
                $width="184px"
                $height="20px"
                $radius="6px"
                $tone="dark"
              />
              <HeroMeta>
                <SkeletonBlock $width="74px" $height="18px" $tone="accent" />
                <SkeletonBlock $width="112px" $height="9px" $tone="dark" />
              </HeroMeta>
            </HeroCopy>
          </HeroIdentity>

          <HeroActions>
            <SkeletonBlock
              $width="78px"
              $height="34px"
              $radius="9px"
              $tone="dark"
            />
            <SkeletonBlock
              $width="34px"
              $height="34px"
              $radius="9px"
              $tone="dark"
            />
          </HeroActions>
        </HeroTop>

        <HeroMetrics>
          <HeroMetric $primary>
            <SkeletonBlock $width="84px" $height="9px" $tone="dark" />
            <SkeletonBlock
              $width="156px"
              $height="22px"
              $radius="6px"
              $tone="dark"
            />
          </HeroMetric>
          <HeroMetric>
            <SkeletonBlock $width="66px" $height="9px" $tone="dark" />
            <SkeletonBlock
              $width="104px"
              $height="18px"
              $radius="6px"
              $tone="accent"
            />
          </HeroMetric>
          <HeroMetric>
            <SkeletonBlock $width="76px" $height="9px" $tone="dark" />
            <SkeletonBlock
              $width="92px"
              $height="18px"
              $radius="6px"
              $tone="dark"
            />
          </HeroMetric>
        </HeroMetrics>
      </Hero>

      <AnalyticsGrid>
        <ChartCard>
          <ChartHeader>
            <ChartControls>
              {[true, false, false].map((active, index) => (
                <ChartControl key={`chart-control-${index}`} $active={active}>
                  <SkeletonBlock
                    $width={active ? "34px" : "20px"}
                    $height="8px"
                    $tone={active ? "dark" : "light"}
                  />
                </ChartControl>
              ))}
            </ChartControls>
            <ChartControls>
              {[true, false, false, false, false, false].map(
                (active, index) => (
                  <ChartControl
                    key={`chart-range-control-${index}`}
                    $active={active}
                  >
                    <SkeletonBlock
                      $width={active ? "34px" : "20px"}
                      $height="8px"
                      $tone={active ? "dark" : "light"}
                    />
                  </ChartControl>
                )
              )}
            </ChartControls>
          </ChartHeader>

          <ChartValue>
            <SkeletonBlock $width="146px" $height="27px" $radius="7px" />
            <SkeletonBlock $width="62px" $height="20px" $tone="accent" />
          </ChartValue>

          <ChartCanvas>
            <svg viewBox="0 0 760 230" preserveAspectRatio="none">
              <defs>
                <linearGradient
                  id="core-portfolio-skeleton-fill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={mainGlobalDark.background} />
                  <stop
                    offset="100%"
                    stopColor={mainGlobalDark.background}
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              <path
                className="core-portfolio-skeleton-area"
                d="M0 188 C45 180 62 157 104 163 C150 169 178 133 222 142 C266 151 282 108 328 117 C374 126 399 93 442 101 C486 109 509 68 550 79 C596 91 624 46 667 59 C703 70 728 37 760 29 L760 230 L0 230 Z"
                fill="url(#core-portfolio-skeleton-fill)"
              />
              <path
                className="core-portfolio-skeleton-line"
                d="M0 188 C45 180 62 157 104 163 C150 169 178 133 222 142 C266 151 282 108 328 117 C374 126 399 93 442 101 C486 109 509 68 550 79 C596 91 624 46 667 59 C703 70 728 37 760 29"
              />
            </svg>
          </ChartCanvas>
          <ChartRange />
        </ChartCard>

        <KpiRail>
          {KPI_CARDS.map((item) => (
            <KpiCard key={`kpi-${item}`}>
              <KpiTop>
                <SkeletonBlock $width="88px" $height="10px" />
                <KpiIcon />
              </KpiTop>
              <SkeletonBlock
                $width={item % 2 === 0 ? "122px" : "96px"}
                $height="20px"
                $radius="6px"
              />
              <SkeletonBlock
                $width={item === 2 ? "72px" : "54px"}
                $height="9px"
                $tone={item === 0 ? "accent" : "light"}
              />
            </KpiCard>
          ))}
        </KpiRail>
      </AnalyticsGrid>

      <SectionCard>
        <SectionHeader>
          <SkeletonBlock $width="92px" $height="16px" $radius="5px" />
          <SkeletonBlock $width="104px" $height="32px" $radius="8px" />
        </SectionHeader>

        <TableHeader>
          {["86px", "54px", "62px", "70px", "58px"].map((width, index) => (
            <SkeletonBlock
              key={`holding-heading-${index}`}
              $width={width}
              $height="8px"
            />
          ))}
        </TableHeader>

        <div>
          {HOLDING_ROWS.map((item) => (
            <TableRow key={`holding-${item}`}>
              <AssetCell>
                <AssetIcon />
                <AssetCopy>
                  <SkeletonBlock $width="92px" $height="11px" />
                  <SkeletonBlock $width="54px" $height="8px" />
                </AssetCopy>
              </AssetCell>
              <SkeletonBlock $width="72px" $height="11px" />
              <SkeletonBlock $width="64px" $height="11px" />
              <SkeletonBlock $width="76px" $height="11px" />
              <SkeletonBlock
                $width="56px"
                $height="11px"
                $tone={item < 3 ? "accent" : "light"}
              />
            </TableRow>
          ))}
        </div>
      </SectionCard>

      <BottomGrid>
        <SectionCard>
          <SectionHeader>
            <SkeletonBlock $width="104px" $height="16px" $radius="5px" />
            <SkeletonBlock $width="58px" $height="9px" />
          </SectionHeader>
          <AllocationBody>
            <AllocationRing />
            <AllocationLegend>
              {LEGEND_ROWS.map((item) => (
                <LegendRow key={`legend-${item}`}>
                  <SkeletonBlock
                    $width={item % 2 === 0 ? "72px" : "58px"}
                    $height="10px"
                  />
                  <SkeletonBlock $width="36px" $height="10px" />
                </LegendRow>
              ))}
            </AllocationLegend>
          </AllocationBody>
        </SectionCard>

        <SectionCard>
          <SectionHeader>
            <SkeletonBlock $width="112px" $height="16px" $radius="5px" />
            <SkeletonBlock $width="88px" $height="32px" $radius="8px" />
          </SectionHeader>
          <TransactionList>
            {TRANSACTION_ROWS.map((item) => (
              <TransactionRow key={`transaction-${item}`}>
                <TransactionAsset>
                  <AssetIcon />
                  <AssetCopy>
                    <SkeletonBlock $width="82px" $height="10px" />
                    <SkeletonBlock $width="52px" $height="8px" />
                  </AssetCopy>
                </TransactionAsset>
                <SkeletonBlock $width="64px" $height="10px" />
                <SkeletonBlock $width="78px" $height="10px" />
              </TransactionRow>
            ))}
          </TransactionList>
        </SectionCard>
      </BottomGrid>
    </div>
  </CoreSkeletonPage>
);

export default CorePortfolioPageSkeleton;
