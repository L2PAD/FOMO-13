import React, { useCallback, useState } from "react";
import BreadCrumbs from "../../../global/BreadCrumbs";
import { PageWrapper } from "../../projects/Connection/styles";
import {
  LeftColumn,
  PredictionDetailsWrapper,
  RightColumn,
  PredictionHeader,
  HeaderTop,
  LogoSection,
  Logo,
  TitleSection,
  Title,
  Creator,
  HeaderBottom,
  CountdownTimer,
  TimeUnit,
  TimeValue,
  TimeLabel,
  VolumeRiskRow,
  VolumeInfo,
  RiskInfo,
  OutcomesSection,
  OutcomesHeader,
  OutcomesTable,
  ChartTooltipLabel,
  OutcomeRow,
  OutcomeLabel,
  ChanceValue,
  BetButton,
  Multiplier,
  BettingCard,
  BettingCardHeader,
  BettingOptions,
  BetOptionButton,
  AmountSection,
  AmountLabel,
  AmountInput,
  AmountSpinnerButtons,
  QuickAmountButtons,
  QuickAmountButton,
  BettingDetails,
  DetailRow,
  PlaceBetButton,
  BettingDisclaimer,
  SentimentSection,
  SentimentTopBox,
  SentimentBadge,
  SentimentDescription,
  SentimentMetrics,
  SentimentMetricRow,
  SentimentFullDescription,
  SentimentBox,
  PredictionChartWrapper,
  ChartHeader,
  ChartTitle,
  ChartSubtitle,
  ChartLegend,
  LegendItem,
  LegendDot,
  ChartControls,
  ChartPeriodButtons,
  ChartPeriodButton,
  ChartCameraButton,
  ChartContainer,
  ChartTooltip,
  TooltipDate,
  TooltipRow,
  TooltipDot,
  TooltipLabel,
  TooltipValue,
  CountdownTooltip,
  TooltipContent,
  TooltipHeader,
  TooltipTime,
} from "./styles";
import CommentBlock from "../../../global/CommentBlock";
import mock1 from "../../../../assets/images/nft/alverse.png";
import mock2 from "../../../../assets/images/nft/humans.png";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUpDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AISentiment } from "../prediction-card/styles";
import AiSentimentIcon from "../../../global/Icons/AiSentimentIcon";
import BullIcon from "../../../global/Icons/BullIcon";
import {
  LeaderboardList,
  LeaderboardName,
  LeaderboardProfit,
  LeaderboardRank,
  LeaderboardRow,
  LeaderboardSearch,
  LeaderboardSection,
  LeaderboardTabs,
  LeaderboardUser,
  LiveBetCard,
  LiveBetInfo,
  LiveBetLeft,
  LiveBetOdds,
  LiveBetRight,
  LiveBetsHeader,
  LiveBetsList,
  LiveBetsSection,
  LiveBetSubtitle,
  LiveBetText,
  LiveBetTitle,
  LiveBetUserRow,
} from "../arena-tab/styles";
import { TimeButton } from "../../../global/common/PriceChart/styles";
import UserHoverCard from "../UserHoverCard";
import UserAvatar from "../../../global/common/UserAvatar";
import Pagination from "../../../global/Pagintaion";
import { filterOptions, leaderboard, liveBets } from "../arena-tab";
import CustomDropdown from "../../../UI/CustomDropdown";
import { useRouter } from "next/navigation";
import useMediaQuery from "../../../../hooks/useMediaQuery";

interface PredictionDetailsProps {
  predictionId: string;
}

const crumbs = [
  { title: "Utility", link: "/utility" },
  { title: "FOMO Arena", link: "/utility/arena" },
  { title: "Ethereum above __ at the end of 2025?", link: "" },
];

// Custom tick component for x-axis labels
const CustomAxisTick = ({ x, y, payload }: any) => {
  const value = payload.value;
  if (!value) return null;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="#738094"
        fontSize={11}
        fontWeight={600}
      >
        {value}
      </text>
    </g>
  );
};

// Custom label for final values with badges
const CustomLabel = ({ viewBox, value, color, index, dataLength, isMobile }: any) => {
  // Only show label for the last data point
  if (index !== dataLength - 1) return null;
  // Hide on mobile
  if (isMobile) return <circle cx={viewBox.x} cy={viewBox.y} r={4} fill={color} />;

  const { x, y } = viewBox;
  const change = ((Math.random() - 0.5) * 10).toFixed(2);
  const isPositive = parseFloat(change) > 0;

  return (
    <g>
      <circle cx={x} cy={y} r={4} fill={color} />
      <foreignObject x={x + 10} y={y - 12} width={80} height={24}>
        <div
          style={{
            background: color,
            color: "white",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "var(--font-weight-semibold)",
            whiteSpace: "nowrap",
          }}
        >
          {isPositive ? "+" : ""}
          {change}%
        </div>
      </foreignObject>
    </g>
  );
};

// Custom tooltip for the chart
const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <ChartTooltip>
        <TooltipDate>{payload[0].payload.tooltipDate}</TooltipDate>
        {payload.map((entry: any, index: number) => (
          <TooltipRow key={index}>
            <TooltipDot color={entry.color} />
            <ChartTooltipLabel>{entry.name}</ChartTooltipLabel>
            <TooltipValue>{entry.value.toFixed(1)}%</TooltipValue>
          </TooltipRow>
        ))}
      </ChartTooltip>
    );
  }
  return null;
};

export const PredictionDetails: React.FC<PredictionDetailsProps> = ({
  predictionId,
}) => {
  const router = useRouter();

  const [selectedOutcomeIndex, setSelectedOutcomeIndex] = useState<number>(0);
  const [betAmount, setBetAmount] = useState(100);
  const [betType, setBetType] = useState<"yes" | "no">("yes");
  const [chartPeriod, setChartPeriod] = useState<"24H" | "7D" | "30D" | "ALL">(
    "30D"
  );
  const [leaderboardTab, setLeaderboardTab] = useState<
    "24H" | "7D" | "30D" | "All"
  >("24H");
  const [betFilter, setBetFilter] = useState<string>("100");
  const [showTooltip, setShowTooltip] = useState(false);
  const [leaderboardSort, setLeaderboardSort] = useState<"profit" | "volume">("profit");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const outcomes = [
    { value: 2500, chance: 100, yesMultiplier: 1.3, noMultiplier: 2.7 },
    { value: 3000, chance: 99, yesMultiplier: 2.8, noMultiplier: 1.3 },
    { value: 3250, chance: 7, yesMultiplier: 4.6, noMultiplier: 1.2 },
    { value: 3500, chance: 1, yesMultiplier: 5.8, noMultiplier: 1.1 },
  ];

  const generateChartData = useCallback(
    (period: "24H" | "7D" | "30D" | "ALL") => {
      const dataPoints =
        period === "24H"
          ? 24
          : period === "7D"
            ? 14
            : period === "30D"
              ? 30
              : 60;
      const data = [];

      for (let i = 0; i < dataPoints; i++) {
        const date = new Date();
        if (period === "24H") {
          date.setHours(date.getHours() - (dataPoints - i));
        } else {
          date.setDate(date.getDate() - (dataPoints - i));
        }

        const monthDay = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const labelInterval =
          period === "24H" ? 4 : period === "7D" ? 2 : period === "30D" ? 5 : 10;
        const showLabel = i % labelInterval === 0 || i === dataPoints - 1;

        // Format for tooltip: "December 27 • 6:00 PM"
        const tooltipDate =
          date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          }) +
          " • " +
          date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

        data.push({
          date:
            period === "24H"
              ? date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
              : monthDay,
          tooltipDate,
          axisLabel: showLabel
            ? period === "24H"
              ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : monthDay
            : "",
          outcome2500: 90 - i * 0.08 - Math.random() * 40,
          outcome3000: 60 - i * 0.12 - Math.random() * 30,
          outcome3250: 30 + i * 0.06 + Math.random() * 20,
          outcome3500: 1 + i * 0.015 + Math.random() * 10,
        });
      }

      return data;
    },
    []
  );

  return (
    <PageWrapper>
      <BreadCrumbs items={crumbs} />
      <PredictionDetailsWrapper>
        <LeftColumn>
          <PredictionHeader>
            <HeaderTop>
              <LogoSection>
                <Logo src={mock1.src} alt="Ethereum" />
                <TitleSection>
                  <Title>Ethereum above __ at the end of 2025?</Title>
                </TitleSection>
              </LogoSection>
            </HeaderTop>
            <HeaderBottom>
              <Creator>
                <Logo src={mock2.src} alt="FOMO" width={20} height={20} />
                <span className="name">FOMO</span>
              </Creator>
              <CountdownTimer
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <CountdownTooltip visible={showTooltip}>
                  <TooltipContent>
                    <TooltipHeader>
                      <span className="live-dot"></span>
                      <span className="live-text">Live</span>
                      <span className="time-left">
                        05 days 08 hrs 49 mins <span>left</span>
                      </span>
                    </TooltipHeader>
                    <TooltipLabel>Resolution Time</TooltipLabel>
                    <TooltipTime>
                      <span className="date">December 31, 2025</span>
                      <span className="time">11:59 PM UTC</span>
                    </TooltipTime>
                  </TooltipContent>
                </CountdownTooltip>
                <TimeUnit>
                  <TimeValue>05</TimeValue>
                  <TimeLabel>days</TimeLabel>
                </TimeUnit>
                <TimeUnit>
                  <TimeValue>08</TimeValue>
                  <TimeLabel>hrs</TimeLabel>
                </TimeUnit>
                <TimeUnit>
                  <TimeValue>49</TimeValue>
                  <TimeLabel>mins</TimeLabel>
                </TimeUnit>
              </CountdownTimer>
              <VolumeRiskRow>
                <VolumeInfo>
                  <span className="value">$70,592,698 Vol.</span>
                </VolumeInfo>
                <RiskInfo>
                  <span className="label">Risks:</span>
                  <span className="value low">Low</span>
                </RiskInfo>
              </VolumeRiskRow>
            </HeaderBottom>
            <OutcomesSection>
              <OutcomesHeader>
                <span>Outcome</span>
                <span className="chance">% Chance</span>
                <span></span>
              </OutcomesHeader>
              <OutcomesTable>
                {outcomes.map((outcome, index) => (
                  <OutcomeRow
                    key={index}
                    selected={selectedOutcomeIndex === index}
                  >
                    <OutcomeLabel>
                      {outcome.value.toLocaleString("en-US")}
                    </OutcomeLabel>
                    <ChanceValue>{outcome.chance}%</ChanceValue>
                    <div className="bet-buttons">
                      <BetButton
                        variant="yes"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOutcomeIndex(index);
                          setBetType("yes");
                        }}
                      >
                        Yes <Multiplier>• {outcome.yesMultiplier}x</Multiplier>
                      </BetButton>
                      <BetButton
                        variant="no"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOutcomeIndex(index);
                          setBetType("no");
                        }}
                      >
                        No <Multiplier>• {outcome.noMultiplier}x</Multiplier>
                      </BetButton>
                    </div>
                  </OutcomeRow>
                ))}
              </OutcomesTable>
            </OutcomesSection>
          </PredictionHeader>

          <PredictionChartWrapper>
            <ChartHeader>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <ChartTitle>
                  {outcomes[selectedOutcomeIndex].value.toLocaleString("en-US")}
                  <span className="percentage">
                    <ArrowUpRight size={16} color="#05A584" />{" "}
                    {outcomes[selectedOutcomeIndex].chance}%
                  </span>
                </ChartTitle>
                <ChartSubtitle>100% Chance</ChartSubtitle>
              </div>
              <ChartControls>
                <ChartPeriodButtons>
                  {(["24H", "7D", "30D", "ALL"] as const).map((period) => (
                    <ChartPeriodButton
                      key={period}
                      active={chartPeriod === period}
                      onClick={() => setChartPeriod(period)}
                    >
                      {period}
                    </ChartPeriodButton>
                  ))}
                </ChartPeriodButtons>
                <ChartCameraButton>
                  <Camera color="#738094" size={18} />
                </ChartCameraButton>
              </ChartControls>
            </ChartHeader>
            <ChartLegend>
              <LegendItem>
                <LegendDot color="#05A584" />
                <span>2,500</span>
              </LegendItem>
              <LegendItem>
                <LegendDot color="#9333EA" />
                <span>3,000</span>
              </LegendItem>
              <LegendItem>
                <LegendDot color="#3B82F6" />
                <span>3,250</span>
              </LegendItem>
              <LegendItem>
                <LegendDot color="#F59E0B" />
                <span>3,500</span>
              </LegendItem>
            </ChartLegend>
            <ChartContainer>
              <ResponsiveContainer width="100%" height={460}>
                <LineChart
                  data={generateChartData(chartPeriod)}
                  margin={{ right: isMobile ? 0 : 90 }}
                >
                  <CartesianGrid
                    strokeDasharray="0"
                    stroke="#E5E9F2"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="axisLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={<CustomAxisTick />}
                    interval={0}
                    height={36}
                  />
                  <YAxis
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#070b35", fontSize: 12, fontWeight: "var(--font-weight-semibold)" }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Line
                    type="basis"
                    dataKey="outcome2500"
                    stroke="#05A584"
                    strokeWidth={2}
                    dot={false}
                    name="2,500"
                    label={(props: any) => (
                      <CustomLabel
                        {...props}
                        color="#05A584"
                        dataLength={generateChartData(chartPeriod).length}
                        isMobile={isMobile}
                      />
                    )}
                  />
                  <Line
                    type="basis"
                    dataKey="outcome3000"
                    stroke="#9333EA"
                    strokeWidth={2}
                    dot={false}
                    name="3,000"
                    label={(props: any) => (
                      <CustomLabel
                        {...props}
                        color="#9333EA"
                        dataLength={generateChartData(chartPeriod).length}
                        isMobile={isMobile}
                      />
                    )}
                  />
                  <Line
                    type="basis"
                    dataKey="outcome3250"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    name="3,250"
                    label={(props: any) => (
                      <CustomLabel
                        {...props}
                        color="#3B82F6"
                        dataLength={generateChartData(chartPeriod).length}
                        isMobile={isMobile}
                      />
                    )}
                  />
                  <Line
                    type="basis"
                    dataKey="outcome3500"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                    name="3,500"
                    label={(props: any) => (
                      <CustomLabel
                        {...props}
                        color="#F59E0B"
                        dataLength={generateChartData(chartPeriod).length}
                        isMobile={isMobile}
                      />
                    )}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </PredictionChartWrapper>

          <LiveBetsSection>
            <LiveBetsHeader>
              <h2>
                <span></span> Live Bets
              </h2>
              <CustomDropdown
                options={filterOptions}
                value={betFilter}
                onChange={(value) => setBetFilter(value as string)}
                placeholder="100+"
                isShowSuccess={false}
                searchable={false}
                className="bet-filter-dropdown"
              />
            </LiveBetsHeader>

            <LiveBetsList>
              {liveBets.map((bet) => (
                <LiveBetCard key={bet.id}>
                  <LiveBetLeft>
                    <UserAvatar
                      avatar={bet.icon}
                      size="medium"
                      variant="default"
                      className="image"
                    />
                    <LiveBetInfo>
                      <div className="title">
                        <LiveBetTitle>{bet.project}</LiveBetTitle>
                        {bet.subtitle && (
                          <LiveBetSubtitle>{bet.subtitle}</LiveBetSubtitle>
                        )}
                      </div>
                      <LiveBetUserRow>
                        <UserHoverCard
                          userName={bet.user}
                          userAvatar={bet.icon}
                        >
                          <div className="user">
                            <UserAvatar
                              avatar={bet.icon}
                              size="xxSmall"
                              variant="default"
                            />
                            <p>{bet.user}</p>
                          </div>
                        </UserHoverCard>
                        <LiveBetText>
                          placed ${bet.amount} at{" "}
                          <LiveBetOdds accent={bet.accent as "green" | "red"}>
                            {bet.betLabel}
                          </LiveBetOdds>{" "}
                          (prediction odds {bet.odds})
                        </LiveBetText>
                      </LiveBetUserRow>
                    </LiveBetInfo>
                  </LiveBetLeft>

                  <LiveBetRight>
                    <span className="time">{bet.time}</span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/utility/arena/1");
                      }}
                    >
                      <ArrowRight size={18} color="#738094" />
                    </button>
                  </LiveBetRight>
                </LiveBetCard>
              ))}
            </LiveBetsList>

            <Pagination
              page={1}
              totalPage={10}
              onChange={() => { }}
              limit={5}
              total={50}
            />
          </LiveBetsSection>
        </LeftColumn>
        <RightColumn>
          <BettingCard>
            <BettingCardHeader>
              <Logo src={mock1.src} alt="Ethereum" />
              <span className="outcome-value">
                {outcomes[selectedOutcomeIndex].value.toLocaleString("en-US")}
              </span>
            </BettingCardHeader>

            <BettingOptions>
              <BetOptionButton
                variant="yes"
                active={betType === "yes"}
                onClick={() => setBetType("yes")}
              >
                Yes • {outcomes[selectedOutcomeIndex].yesMultiplier}x
              </BetOptionButton>
              <BetOptionButton
                variant="no"
                active={betType === "no"}
                onClick={() => setBetType("no")}
              >
                No • {outcomes[selectedOutcomeIndex].noMultiplier}x
              </BetOptionButton>
            </BettingOptions>

            <AmountSection>
              <AmountLabel>Amount</AmountLabel>
              <AmountInput>
                <span className="currency">USDT</span>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  min="0"
                />
                <AmountSpinnerButtons>
                  <button onClick={() => setBetAmount(betAmount + 1)}>
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => setBetAmount(Math.max(0, betAmount - 1))}
                  >
                    <ChevronDown size={12} />
                  </button>
                </AmountSpinnerButtons>
              </AmountInput>
              <QuickAmountButtons>
                <QuickAmountButton onClick={() => setBetAmount(betAmount + 1)}>
                  +1
                </QuickAmountButton>
                <QuickAmountButton onClick={() => setBetAmount(betAmount + 10)}>
                  +10
                </QuickAmountButton>
                <QuickAmountButton
                  onClick={() => setBetAmount(betAmount + 100)}
                >
                  +100
                </QuickAmountButton>
                <QuickAmountButton onClick={() => setBetAmount(10000)}>
                  Max
                </QuickAmountButton>
              </QuickAmountButtons>
            </AmountSection>

            <BettingDetails>
              <DetailRow>
                <span className="label">To potentially return</span>
                <span className="value highlight">
                  {(
                    betAmount *
                    (betType === "yes"
                      ? outcomes[selectedOutcomeIndex].yesMultiplier
                      : outcomes[selectedOutcomeIndex].noMultiplier)
                  ).toFixed(0)}{" "}
                  USDT
                </span>
              </DetailRow>
              <DetailRow>
                <span className="label">Avg. Price</span>
                <span className="value">
                  {(
                    betAmount /
                    (betAmount *
                      (betType === "yes"
                        ? outcomes[selectedOutcomeIndex].yesMultiplier
                        : outcomes[selectedOutcomeIndex].noMultiplier))
                  ).toFixed(2)}{" "}
                  USDT
                </span>
              </DetailRow>
              <DetailRow>
                <span className="label">Platform Fee</span>
                <span className="value">3%</span>
              </DetailRow>
            </BettingDetails>

            <PlaceBetButton
              onClick={() => {
                console.log(`Placing bet: ${betAmount} USDT`);
              }}
            >
              Place a Bet
            </PlaceBetButton>
          </BettingCard>
          <BettingDisclaimer>
            By trading you confirm that you have read and agree to the{" "}
            <span className="link">Terms of Use</span>.<br />
            Always do your own research.
          </BettingDisclaimer>

          <AISentiment
            style={{
              margin: "20px 0",
              fontSize: "14px",
              padding: "8px 12px",
              borderRadius: "px",
            }}
          >
            <AiSentimentIcon />
            AI Sentiment
          </AISentiment>

          <SentimentSection>
            <SentimentTopBox sentiment="Bullish">
              <SentimentBadge sentiment="Bullish">
                <BullIcon />
                Bullish
              </SentimentBadge>
              <SentimentDescription>
                Strong upward momentum with growing attention.
              </SentimentDescription>
            </SentimentTopBox>

            <SentimentMetrics>
              <SentimentMetricRow>
                <span>Momentum indicator</span>
                <span style={{ color: "#05A584", fontWeight: "var(--font-weight-semibold)" }}>+0.62</span>
              </SentimentMetricRow>
              <SentimentMetricRow>
                <span>Attention index</span>
                <span style={{ color: "#05A584", fontWeight: "var(--font-weight-semibold)" }}>
                  78/100
                </span>
              </SentimentMetricRow>
              <SentimentMetricRow>
                <span>Consensus strength</span>
                <span style={{ color: "#FFB800", fontWeight: "var(--font-weight-semibold)" }}>
                  Moderate
                </span>
              </SentimentMetricRow>
              <SentimentMetricRow>
                <span>Volatility pressure</span>
                <span style={{ color: "#FFB800", fontWeight: "var(--font-weight-semibold)" }}>
                  Medium
                </span>
              </SentimentMetricRow>
              <SentimentMetricRow>
                <span>Narrative direction</span>
                <span style={{ color: "#05A584", fontWeight: "var(--font-weight-semibold)" }}>
                  Expanding
                </span>
              </SentimentMetricRow>
            </SentimentMetrics>

            <SentimentFullDescription>
              Current market signals indicate a positive medium-term momentum
              for Ethereum. Activity around ETH remains elevated, supported by
              institutional interest, ongoing Layer-2 development, and an
              overall improvement in the market narrative.
              <br />
              The 2,500 level appears to be aligned with the current momentum
              and dominant narrative. The 3,000 level shows increased upside
              potential; however, this scenario carries higher uncertainty and
              remains dependent on the continuation of the broader macro trend.
              <br />
              AI assesses the overall context as favorable, while noting that
              different price levels involve distinct risk profiles.
              <br />
              <span style={{ fontWeight: "var(--font-weight-semibold)", color: "#0f172a" }}>
                (AI — analytical layer, no impact on payout).
              </span>
            </SentimentFullDescription>

            <SentimentBox>
              <p>
                AI Sentiment is provided for informational purposes only and
                does not constitute financial or investment advice.
              </p>
            </SentimentBox>
          </SentimentSection>
          <LeaderboardSection
            style={{
              marginTop: "40px",
            }}
          >
            <LiveBetsHeader>
              <h2>Leaderboard</h2>
              <LeaderboardTabs>
                <TimeButton
                  active={leaderboardTab === "24H"}
                  onClick={() => setLeaderboardTab("24H")}
                >
                  24H
                </TimeButton>
                <TimeButton
                  active={leaderboardTab === "7D"}
                  onClick={() => setLeaderboardTab("7D")}
                >
                  7D
                </TimeButton>
                <TimeButton
                  active={leaderboardTab === "30D"}
                  onClick={() => setLeaderboardTab("30D")}
                >
                  30D
                </TimeButton>
                <TimeButton
                  active={leaderboardTab === "All"}
                  onClick={() => setLeaderboardTab("All")}
                >
                  All
                </TimeButton>
              </LeaderboardTabs>
            </LiveBetsHeader>

            <div className="row">
              <LeaderboardSearch>
                <Search size={16} color="#738094" />
                <input placeholder="Search by name" />
              </LeaderboardSearch>
              <button
                onClick={() => setLeaderboardSort(prev => prev === "profit" ? "volume" : "profit")}
                style={{
                  cursor: "pointer",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "color 0.2s ease",
                  background: "none",
                  border: "none",
                  color: "#728094",
                  fontWeight: "var(--font-weight-semibold)",
                  fontSize: "14px",
                  padding: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#0F172A"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#728094"}
              >
                {leaderboardSort === "profit" ? "Profit/Loss" : "Volume"}
                <ArrowUpDown size={14} />
              </button>
            </div>

            <LeaderboardList>
              {leaderboard.map((item) => (
                <LeaderboardRow key={item.id}>
                  <LeaderboardRank>{item.id}</LeaderboardRank>
                  <UserHoverCard userName={item.name} userAvatar={item.avatar}>
                    <LeaderboardUser>
                      <UserAvatar
                        avatar={item.avatar}
                        size="otc"
                        variant="success"
                        rating={94}
                      />
                      <LeaderboardName>{item.name}</LeaderboardName>
                    </LeaderboardUser>
                  </UserHoverCard>
                  <LeaderboardProfit>
                    {leaderboardSort === "profit"
                      ? `+$${item.profit.toLocaleString("en-US")}`
                      : `$${item.volume.toLocaleString("en-US")}`
                    }
                  </LeaderboardProfit>
                </LeaderboardRow>
              ))}
            </LeaderboardList>

            <Pagination
              page={1}
              totalPage={84}
              onChange={() => { }}
              limit={10}
              total={840}
              style={{ marginTop: 20 }}
            />
          </LeaderboardSection>
        </RightColumn>
      </PredictionDetailsWrapper>

      <CommentBlock />
    </PageWrapper>
  );
};
