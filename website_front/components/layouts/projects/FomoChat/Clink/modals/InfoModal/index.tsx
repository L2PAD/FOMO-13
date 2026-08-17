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
import { X, Calendar, MapPin, CheckCircle, XCircle } from "lucide-react";
import imageLoader from "../../../../../../../helpers/imageLoader";

interface Props {
  onClose: () => void;
  user: any;
}

const InfoModal: FC<Props> = ({ onClose, user }) => {
  const isVerified = user?.isVerified || false;
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
        <CloseButton onClick={onClose}>
          <X size={24} />
        </CloseButton>

        <UserSection>
          <UserAvatar
            src={
              user?.photo
                ? imageLoader(user.photo)
                : user?.twitterData?.photo || "/static/default-avatar.png"
            }
            alt={user?.username || user?.twitterData?.username}
          />
          <UserName>
            {user?.username || user?.twitterData?.username || "Grace Miller"}
          </UserName>
          <UserHandle>
            @
            {user?.twitterData?.username ||
              user?.username?.toLowerCase() ||
              "gracemiller08"}
          </UserHandle>
        </UserSection>

        <StatsRow>
          <StatItem>
            <StatLabel>Current Rank</StatLabel>
            <StatValue>{user?.rank || "Astral Sage"}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>XP Range</StatLabel>
            <StatValue>{user?.xp || "875"}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Rating</StatLabel>
            <StatValue>{user?.rating || "93"}/100</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Flags</StatLabel>
            <StatValue style={{ color: "#FF5858" }}>
              {user?.flags || "0"}
            </StatValue>
          </StatItem>
        </StatsRow>

        <InfoSection>
          <InfoRow>
            <InfoIcon>
              {isVerified ? (
                <CheckCircle size={20} color="#04A584" />
              ) : (
                <XCircle size={20} color="#FF5858" />
              )}
            </InfoIcon>
            <InfoLabel>Verification</InfoLabel>
            <InfoValue isVerified={isVerified}>
              {isVerified ? "Verified" : "Not Verified"}
            </InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoIcon>
              <Calendar size={20} color="#728094" />
            </InfoIcon>
            <InfoLabel>Date Joined</InfoLabel>
            <InfoValue>{dateJoined}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoIcon>
              <MapPin size={20} color="#728094" />
            </InfoIcon>
            <InfoLabel>Location</InfoLabel>
            <InfoValue>
              {user?.location || user?.country || "Ukraine, Kyiv"}
            </InfoValue>
          </InfoRow>
        </InfoSection>
      </ModalContent>
    </ModalOverlay>
  );
};

export default InfoModal;
