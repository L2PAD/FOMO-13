import React, { useState } from "react";
import { ChevronDown, ChevronUp, Star, X } from "lucide-react";
import {
  CardWrapper,
  CardHeader,
  LeftSection,
  TitleSection,
  Title,
  Subtitle,
  RightSection,
  CardBody,
  InfoRow,
  InfoItem,
  InfoLabel,
  InfoValue,
  PercentageRow,
  PercentageBox,
  PercentageIcon,
  PercentageValue,
  YesNoContainer,
  YesNoRow,
  ThresholdValue,
  YesNoButtons,
  YesButton,
  NoButton,
  ConditionalContainer,
  ConditionRow,
  ConditionLabel,
  ConditionText,
  CardFooter,
  Author,
  AISentiment,
  StatusBadge,
  StatusDot,
  StarButton,
  RiskBadge,
  ChanceContainer,
  ChanceLabel,
  ChanceValue,
  ProgressBar,
  ProgressFill,
  SentimentModal,
  SentimentModalContent,
  SentimentHeader,
  SentimentCloseButton,
  SentimentBox,
  SentimentButton,
  SentimentTopBox,
  SentimentBadge,
  SentimentDescription,
  SentimentMetrics,
  SentimentMetricRow,
  SentimentFullDescription,
  BetModalContent,
  BetHeader,
  BetTitle,
  BetCloseButton,
  BetContent,
  BetOption,
  BetInput,
  BetRow,
  BetInfo,
  BetButton,
  BetSpinnerButtons,
  UserPosition,
  SellPosition,
} from "./styles";
import UserAvatar from "../../../global/common/UserAvatar";
import BullIcon from "../../../global/Icons/BullIcon";
import BearIcon from "../../../global/Icons/BearIcon";
import FireHypeIcon from "../../../global/Icons/FireHypeIcon";
import AiSentimentIcon from "../../../global/Icons/AiSentimentIcon";
import { useRouter } from "next/navigation";
import { ConditionalBetModal } from "../conditional-bet-modal/ConditionalBetModal";
import CreateDealModal from "../../projects/modals/CreateDealModal";

interface PredictionCardProps {
  type: "percentage" | "yes-no" | "conditional" | "chance";
  title: string;
  subtitle?: string;
  logo: string;
  status: "Active" | "Live" | "Pending" | "Resolved";
  risk: "Low" | "Medium" | "High";
  tgeDate?: string;
  marketCap?: string;
  hype?: "Low" | "Medium" | "High";
  author: {
    name: string;
    avatar: string;
  };
  percentages?: {
    positive: number;
    negative: number;
  };
  yesNoOptions?: Array<{
    threshold: string;
    percentage: string;
  }>;
  conditional?: {
    condition: string;
    result: string;
  };
  chance?: {
    percentage: number;
    label?: string;
  };
  sentiment?: {
    sentiment: "Bullish" | "Bearish" | "Neutral";
    description: string;
    momentumIndicator: string;
    attentionIndex: string;
    consensusStrength: "Strong" | "Moderate" | "Weak";
    volatilityPressure: "Low" | "Medium" | "High";
    narrativeDirection: string;
    fullDescription: string;
  };
}

const PredictionCard: React.FC<PredictionCardProps> = ({
  type,
  title,
  subtitle,
  logo,
  status,
  risk,
  tgeDate,
  marketCap,
  hype,
  author,
  percentages,
  yesNoOptions,
  conditional,
  chance,
  sentiment,
}) => {
  const router = useRouter();
  const [isSentimentOpen, setIsSentimentOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<{
    type: "yes" | "no" | "bull" | "bear" | "if" | "then" | "chance";
    label: string;
  } | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [userPosition, setUserPosition] = useState<{
    amount: number;
    option: "yes" | "no" | "bull" | "bear";
    multiplier: number;
  } | null>(null);
  const [isConditionalBetOpen, setIsConditionalBetOpen] = useState(false);
  const [isCreateDealModalOpen, setIsCreateDealModalOpen] = useState(false);
  const [conditionalBets, setConditionalBets] = useState<{
    if: { side: "yes" | "no" | null; amount: number };
    thenBet: { side: "yes" | "no" | null; amount: number };
  }>({
    if: { side: null, amount: 100 },
    thenBet: { side: null, amount: 50 },
  });

  const handleConditionalBetOpen = (
    section: "if" | "then",
    side: "yes" | "no"
  ) => {
    setConditionalBets({
      if: {
        side: section === "if" ? side : null,
        amount: 100,
      },
      thenBet: {
        side: section === "then" ? side : null,
        amount: 50,
      },
    });
    setIsConditionalBetOpen(true);
  };

  const handlePlaceBet = () => {
    console.log("Placing conditional bets:", conditionalBets);
    setIsConditionalBetOpen(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "#05A584";
      case "Medium":
        return "#FFB800";
      case "High":
        return "#FF5858";
      default:
        return "#738094";
    }
  };

  const isUsedConditional = conditional !== undefined;

  return (
    <>
      <CardWrapper
        isOpen={isSentimentOpen}
        onClick={(e) => {
          e.stopPropagation();
          router.push("/utility/arena/1");
        }}
      >
        {selectedOption ? (
          <BetModalContent
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <BetHeader>
              <BetTitle>
                <img src={logo} alt={title} />
                <h3>{selectedOption.label}</h3>
              </BetTitle>
              <BetCloseButton
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOption(null);
                }}
              >
                <X size={18} />
              </BetCloseButton>
            </BetHeader>

            <BetContent>
              <BetOption>
                <span
                  style={{
                    color:
                      selectedOption.type === "yes" ? "#05A584" : "#FF5857",
                  }}
                >
                  {(() => {
                    switch (selectedOption.type) {
                      case "yes":
                        return "Yes";
                      case "no":
                        return "No";
                      case "bull":
                        return <BullIcon />;
                      case "bear":
                        return <BearIcon />;
                      default:
                        return "";
                    }
                  })()}
                </span>
              </BetOption>

              <BetInput>
                <BetRow>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    min="0"
                  />
                  <span className="increment">+10</span>
                  <BetSpinnerButtons>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBetAmount(betAmount + 10);
                      }}
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBetAmount(Math.max(0, betAmount - 10));
                      }}
                    >
                      <ChevronDown size={12} />
                    </button>
                  </BetSpinnerButtons>
                </BetRow>
                <BetInfo>
                  Potential return: <strong>140 USDT</strong>
                </BetInfo>
              </BetInput>
            </BetContent>
            <BetButton
              onClick={(e) => {
                e.stopPropagation();
                console.log(
                  `Placing bet: ${betAmount} USDT on ${selectedOption.label}`
                );
                setUserPosition({
                  amount: betAmount,
                  option: selectedOption.type as "yes" | "no" | "bull" | "bear",
                  multiplier: 3.2,
                });
                setSelectedOption(null);
              }}
            >
              Place a Bet
            </BetButton>
          </BetModalContent>
        ) : (
          <>
            <CardHeader>
              <LeftSection>
                <UserAvatar
                  avatar={author.avatar}
                  size="otc"
                  variant="spotlight"
                />
                <TitleSection>
                  <Title>{title}</Title>
                  {subtitle && <Subtitle>{subtitle}</Subtitle>}
                </TitleSection>
              </LeftSection>
              <RightSection>
                <div className="row">
                  <StatusBadge status={status}>
                    {status === "Live" && <StatusDot />}
                    {status}
                  </StatusBadge>
                  <StarButton onClick={(e) => e.stopPropagation()}>
                    <Star size={22} color="#738094" />
                  </StarButton>
                </div>
                <RiskBadge>
                  Risks:{" "}
                  <span style={{ color: getRiskColor(risk) }}>{risk}</span>
                </RiskBadge>
              </RightSection>
            </CardHeader>

            <CardBody className={isUsedConditional ? "with-yes-no" : ""}>
              {(tgeDate || marketCap || hype) && (
                <InfoRow className="info-row">
                  {tgeDate && (
                    <InfoItem className={"info-item"}>
                      <InfoLabel>TGE Date</InfoLabel>
                      <InfoValue>{tgeDate}</InfoValue>
                    </InfoItem>
                  )}
                  {marketCap && (
                    <InfoItem className={"info-item"}>
                      <InfoLabel>M. Cap</InfoLabel>
                      <InfoValue>{marketCap}</InfoValue>
                    </InfoItem>
                  )}
                  {hype && (
                    <InfoItem className={"info-item"}>
                      <InfoLabel>Hype</InfoLabel>
                      <InfoValue>
                        <FireHypeIcon />{" "}
                        <span style={{ color: "#05A584" }}>{hype}</span>
                      </InfoValue>
                    </InfoItem>
                  )}
                </InfoRow>
              )}

              {type === "percentage" && percentages && (
                <PercentageRow>
                  <PercentageBox
                    positive
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOption({ type: "bull", label: title });
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <PercentageIcon>
                      <BullIcon />
                    </PercentageIcon>
                    <PercentageValue>{percentages.positive}%</PercentageValue>
                  </PercentageBox>
                  <PercentageBox
                    negative
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOption({ type: "bear", label: title });
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <PercentageIcon>
                      <BearIcon />
                    </PercentageIcon>
                    <PercentageValue>{percentages.negative}%</PercentageValue>
                  </PercentageBox>
                </PercentageRow>
              )}

              {type === "yes-no" && yesNoOptions && (
                <YesNoContainer>
                  {yesNoOptions.map((option, index) => (
                    <YesNoRow key={index}>
                      <ThresholdValue>{option.threshold}</ThresholdValue>
                      <PercentageValue>{option.percentage}</PercentageValue>
                      <YesNoButtons>
                        <YesButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOption({ type: "yes", label: "Yes" });
                          }}
                        >
                          Yes
                        </YesButton>
                        <NoButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOption({ type: "no", label: "No" });
                          }}
                        >
                          No
                        </NoButton>
                      </YesNoButtons>
                    </YesNoRow>
                  ))}
                </YesNoContainer>
              )}

              {type === "conditional" && conditional && (
                <ConditionalContainer>
                  <ConditionRow>
                    <div className="condition-content">
                      <ConditionLabel>If</ConditionLabel>
                      <ConditionText>{conditional.condition}</ConditionText>
                    </div>
                    <div className="condition-buttons">
                      <YesButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConditionalBetOpen("if", "yes");
                        }}
                      >
                        Yes
                      </YesButton>
                      <NoButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConditionalBetOpen("if", "no");
                        }}
                      >
                        No
                      </NoButton>
                    </div>
                  </ConditionRow>
                  <ConditionRow>
                    <div className="condition-content">
                      <ConditionLabel>Then</ConditionLabel>
                      <ConditionText>{conditional.result}</ConditionText>
                    </div>
                    <div className="condition-buttons">
                      <YesButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConditionalBetOpen("then", "yes");
                        }}
                      >
                        Yes
                      </YesButton>
                      <NoButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConditionalBetOpen("then", "no");
                        }}
                      >
                        No
                      </NoButton>
                    </div>
                  </ConditionRow>
                </ConditionalContainer>
              )}

              {type === "chance" && chance && (
                <ChanceContainer>
                  <div className="row">
                    <ChanceLabel>{chance.label || "Chance"}</ChanceLabel>
                    <ChanceValue>{chance.percentage}%</ChanceValue>
                  </div>
                  <ProgressBar>
                    <ProgressFill percentage={chance.percentage} />
                  </ProgressBar>
                  <YesNoButtons>
                    <YesButton onClick={(e) => e.stopPropagation()}>
                      Yes
                    </YesButton>
                    <NoButton onClick={(e) => e.stopPropagation()}>No</NoButton>
                  </YesNoButtons>
                </ChanceContainer>
              )}
            </CardBody>

            {userPosition ? (
              <>
                <UserPosition>
                  <span className="label">Your position:</span>
                  <span className="value">
                    {userPosition.amount} USDT –{" "}
                    <span
                      className="option"
                      style={{
                        color:
                          userPosition.option === "yes" ||
                          userPosition.option === "bull"
                            ? "#05A584"
                            : "#FF5858",
                      }}
                    >
                      {userPosition.option === "yes"
                        ? "Yes"
                        : userPosition.option === "no"
                          ? "No"
                          : userPosition.option === "bull"
                            ? "Bull"
                            : "Bear"}
                    </span>{" "}
                    {userPosition.multiplier}x
                  </span>
                </UserPosition>
                <SellPosition className="sell-position">
                  <BetButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreateDealModalOpen(true);
                    }}
                    style={{
                      width: "calc(100% - 40px)",
                    }}
                  >
                    Sell Position
                  </BetButton>
                </SellPosition>
              </>
            ) : (
              <CardFooter>
                <Author>
                  <UserAvatar
                    avatar={author.avatar}
                    size="xxSmall"
                    variant="default"
                  />
                  {author.name}
                </Author>
                <AISentiment
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSentimentOpen(!isSentimentOpen);
                  }}
                >
                  <AiSentimentIcon />
                  AI Sentiment
                </AISentiment>
              </CardFooter>
            )}

            {isSentimentOpen && type === "chance" && (
              <SentimentModal>
                <SentimentModalContent>
                  <SentimentHeader>
                    <span>AI Sentiment</span>
                    <SentimentCloseButton
                      onClick={() => setIsSentimentOpen(false)}
                    >
                      <X size={20} />
                    </SentimentCloseButton>
                  </SentimentHeader>
                  <SentimentBox>
                    <p
                      style={{
                        fontWeight: "var(--font-weight-medium)",
                      }}
                    >
                      AI Sentiment is available to FOMO NFT holders.
                    </p>
                    <p>
                      Unlock advanced market context and sentiment insights by
                      upgrading access.
                    </p>
                  </SentimentBox>
                  <SentimentBox>
                    <p>
                      AI Sentiment is provided for informational purposes only
                      and does not constitute financial or investment advice.
                    </p>
                  </SentimentBox>
                  <SentimentButton onClick={(e) => e.stopPropagation()}>
                    Get FOMO NFT
                  </SentimentButton>
                </SentimentModalContent>
              </SentimentModal>
            )}

            {isSentimentOpen && type !== "chance" && sentiment && (
              <SentimentModal>
                <SentimentModalContent>
                  <SentimentHeader>
                    <span>AI Sentiment</span>
                    <SentimentCloseButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSentimentOpen(false);
                      }}
                    >
                      <X size={20} />
                    </SentimentCloseButton>
                  </SentimentHeader>
                  <SentimentTopBox sentiment={sentiment.sentiment}>
                    <SentimentBadge sentiment={sentiment.sentiment}>
                      {sentiment.sentiment === "Bullish" && <BullIcon />}
                      {sentiment.sentiment === "Bearish" && <BearIcon />}
                      {sentiment.sentiment}
                    </SentimentBadge>
                    <SentimentDescription>
                      {sentiment.description}
                    </SentimentDescription>
                  </SentimentTopBox>
                  <SentimentMetrics>
                    <SentimentMetricRow>
                      <span>Momentum indicator</span>
                      <span style={{ color: "#05a584", fontWeight: "var(--font-weight-semibold)" }}>
                        {sentiment.momentumIndicator}
                      </span>
                    </SentimentMetricRow>
                    <SentimentMetricRow>
                      <span>Attention index</span>
                      <span style={{ color: "#05a584", fontWeight: "var(--font-weight-semibold)" }}>
                        {sentiment.attentionIndex}
                      </span>
                    </SentimentMetricRow>
                    <SentimentMetricRow>
                      <span>Consensus strength</span>
                      <span
                        style={{
                          color:
                            sentiment.consensusStrength === "Moderate"
                              ? "#ffc704"
                              : sentiment.consensusStrength === "Strong"
                                ? "#05a584"
                                : "#ff5858",
                          fontWeight: "var(--font-weight-semibold)",
                        }}
                      >
                        {sentiment.consensusStrength}
                      </span>
                    </SentimentMetricRow>
                    <SentimentMetricRow>
                      <span>Volatility pressure</span>
                      <span
                        style={{
                          color:
                            sentiment.volatilityPressure === "High"
                              ? "#ff5858"
                              : sentiment.volatilityPressure === "Medium"
                                ? "#ffc704"
                                : "#05a584",
                          fontWeight: "var(--font-weight-semibold)",
                        }}
                      >
                        {sentiment.volatilityPressure}
                      </span>
                    </SentimentMetricRow>
                    <SentimentMetricRow>
                      <span>Narrative direction</span>
                      <span style={{ color: "#05a584", fontWeight: "var(--font-weight-semibold)" }}>
                        {sentiment.narrativeDirection}
                      </span>
                    </SentimentMetricRow>
                  </SentimentMetrics>
                  <SentimentFullDescription>
                    {sentiment.fullDescription}
                  </SentimentFullDescription>
                  <SentimentBox>
                    <p>
                      AI Sentiment is provided for informational purposes only
                      and does not constitute financial or investment advice.
                    </p>
                  </SentimentBox>
                </SentimentModalContent>
              </SentimentModal>
            )}
          </>
        )}
      </CardWrapper>
      {type === "conditional" && conditional && (
        <ConditionalBetModal
          isOpen={isConditionalBetOpen}
          onClose={() => setIsConditionalBetOpen(false)}
          logo={logo}
          title={title}
          subtitle={subtitle}
          status={status}
          risk={risk}
          conditional={conditional}
          conditionalBets={conditionalBets}
          setConditionalBets={setConditionalBets}
          onPlaceBet={handlePlaceBet}
        />
      )}
      <CreateDealModal
        isVisible={isCreateDealModalOpen}
        onClose={() => setIsCreateDealModalOpen(false)}
        disableBuyButton={true}
      />
    </>
  );
};

export default PredictionCard;
