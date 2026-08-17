import React from "react";
import { toast } from "react-toastify";
import {
  Card,
  CardHeader,
  SideBadge,
  HighStakesBadge,
  Title,
  HostSection,
  HostInfo,
  HostName,
  HostLabel,
  Stakes,
  StakeRow,
  Footer,
  Timer,
  StatusBadge,
  Actions,
  ActionButton,
} from "./DuelCard.styles";
import { Clock } from "lucide-react";
import UserAvatar from "../../../global/common/UserAvatar";
import UserHoverCard from "../UserHoverCard";
import { DuelToast } from "../../../UI/DuelToast/DuelToast";

interface DuelCardProps {
  side: "yes" | "no";
  isHighStakes: boolean;
  title: string;
  hostName: string;
  hostAvatar: string;
  stakePerSide: number;
  totalPot: number;
  timeLeft: string;
  status: "ends-soon" | "slot-free" | "no-slots";
  availableActions: ("join-yes" | "join-no" | "yes" | "no")[];
}

export const DuelCard: React.FC<DuelCardProps> = ({
  side,
  isHighStakes,
  title,
  hostName,
  hostAvatar,
  stakePerSide,
  totalPot,
  timeLeft,
  status,
  availableActions,
}) => {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ends-soon":
        return "Ends Soon";
      case "slot-free":
        return "1 slot free";
      case "no-slots":
        return "No free slots";
      default:
        return "";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ends-soon":
        return "warning";
      case "slot-free":
        return "success";
      case "no-slots":
        return "danger";
      default:
        return undefined;
    }
  };

  const handleJoinDuel = (joinSide: "yes" | "no") => {
    const sideText = joinSide === "yes" ? "YES" : "NO";
    toast.success(
      <DuelToast
        title={`Joined duel as ${sideText}!`}
        description={`Stake: ${stakePerSide.toLocaleString()} USDT`}
      />,
      {
        icon: false,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <SideBadge $side={side}>{side === "yes" ? "Yes" : "No"}</SideBadge>
        {isHighStakes && <HighStakesBadge>High Stakes</HighStakesBadge>}
      </CardHeader>

      <Title>{title}</Title>

      <HostSection>
        <UserHoverCard userName={hostName} userAvatar={hostAvatar}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <UserAvatar avatar={hostAvatar} size="otc" variant="default" />
            <HostInfo>
              <HostName>{hostName}</HostName>
              <HostLabel>Host</HostLabel>
            </HostInfo>
          </div>
        </UserHoverCard>
      </HostSection>

      <Stakes>
        <StakeRow>
          <span className="label">Stake per side</span>
          <span className="value">{stakePerSide.toLocaleString()} USDT</span>
        </StakeRow>
        <StakeRow>
          <span className="label">Total Pot</span>
          <span className="value gray">{totalPot.toLocaleString()} USDT</span>
        </StakeRow>
      </Stakes>

      <Footer>
        <Actions>
          <Timer>
            <Clock size={16} />
            {timeLeft}
          </Timer>
          <StatusBadge $variant={getStatusVariant(status)}>
            {getStatusLabel(status)}
          </StatusBadge>
        </Actions>
        <Actions>
          <ActionButton
            $variant="success"
            $disabled={side === "yes"}
            disabled={side === "yes"}
            onClick={() => side !== "yes" && handleJoinDuel("yes")}
          >
            {side === "yes" ? "Yes" : "Join Yes"}
          </ActionButton>
          <ActionButton
            $variant="danger"
            $disabled={side === "no"}
            disabled={side === "no"}
            onClick={() => side !== "no" && handleJoinDuel("no")}
          >
            {side === "no" ? "No" : "Join No"}
          </ActionButton>
        </Actions>
      </Footer>
    </Card>
  );
};
