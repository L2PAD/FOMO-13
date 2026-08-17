import React, { FC } from "react";
import {
  ModalOverlay,
  ModalContent,
  CloseButton,
  UserSection,
  UserAvatar,
  UserName,
  UserHandle,
  StatsRow,
  StatItem,
  StatLabel,
  StatValue,
  InfoSection,
  InfoRow,
  InfoIcon,
  InfoLabel,
  InfoValue,
} from "./styles";
import loader from "../../../../../services/loader";

interface Props {
  onClose: () => void;
  user: any;
}

const InfoModal: FC<Props> = ({ onClose, user }) => {
  const isVerified = Boolean(
    user?.verificationStatus ?? user?.isVerified ?? false
  );
  const dateJoined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "December 08, 2024";

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>x</CloseButton>

        <UserSection>
          <UserAvatar
            src={
              user?.photo
                ? loader(user.photo)
                : user?.twitterData?.photo || ""
            }
            alt={user?.username || user?.twitterData?.username}
          />
          <UserName>
            {user?.username || user?.twitterData?.username || "User"}
          </UserName>
          <UserHandle>
            @
            {user?.twitterData?.username ||
              user?.username?.toLowerCase() ||
              "user"}
          </UserHandle>
        </UserSection>

        <StatsRow>
          <StatItem>
            <StatLabel>Current Rank</StatLabel>
            <StatValue>{user?.rank || "-"}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>XP Range</StatLabel>
            <StatValue>{user?.xp || user?.activityXP || "0"}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Rating</StatLabel>
            <StatValue>{user?.rating || "0"}/100</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Flags</StatLabel>
            <StatValue style={{ color: "#FF5858" }}>
              {user?.flags || user?.redFlags || "0"}
            </StatValue>
          </StatItem>
        </StatsRow>

        <InfoSection>
          <InfoRow>
            <InfoIcon>{isVerified ? "OK" : "NO"}</InfoIcon>
            <InfoLabel>Verification</InfoLabel>
            <InfoValue isVerified={isVerified}>
              {isVerified ? "Verified" : "Not Verified"}
            </InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoIcon>DATE</InfoIcon>
            <InfoLabel>Date Joined</InfoLabel>
            <InfoValue>{dateJoined}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoIcon>LOC</InfoIcon>
            <InfoLabel>Location</InfoLabel>
            <InfoValue>
              {user?.location || user?.country || user?.regionData?.country || "-"}
            </InfoValue>
          </InfoRow>
        </InfoSection>
      </ModalContent>
    </ModalOverlay>
  );
};

export default InfoModal;
