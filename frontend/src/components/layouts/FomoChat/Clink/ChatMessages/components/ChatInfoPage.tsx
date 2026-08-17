import React, { FC } from "react";
import loader from "../../../../../services/loader";
import {
  getDisplayChatUser,
  getSupportAwareAvatar,
  getSupportAwareHandle,
  getSupportAwareName,
} from "../../supportIdentity";
import {
  InfoPage,
  InfoHeader,
  BackButton,
  InfoTitle,
  InfoUserSection,
  InfoUserName,
  InfoUserHandle,
  InfoStatsRow,
  InfoStatItem,
  InfoStatLabel,
  InfoStatValue,
  InfoDetailsSection,
  InfoDetailRow,
  InfoDetailIcon,
  InfoDetailLabel,
  InfoDetailValue,
} from "../styles";

interface ChatInfoPageProps {
  chat: any;
  onBack: () => void;
}

const ChatInfoPage: FC<ChatInfoPageProps> = ({ chat, onBack }) => {
  const displayUser = getDisplayChatUser(chat);
  const displayName = getSupportAwareName(displayUser);
  const displayAvatar = getSupportAwareAvatar(
    displayUser,
    displayUser?.photo
      ? loader(displayUser.photo)
      : displayUser?.twitterData?.photo || ""
  );
  const displayHandle = getSupportAwareHandle(displayUser);

  return (
    <InfoPage>
      <InfoHeader>
        <BackButton onClick={onBack}>Back</BackButton>
        <InfoTitle>Info</InfoTitle>
      </InfoHeader>

      <InfoUserSection>
        <img
          src={displayAvatar}
          alt={displayName}
          style={{ width: 120, height: 120, borderRadius: "50%" }}
        />
        <InfoUserName>{displayName}</InfoUserName>
        <InfoUserHandle>{displayHandle}</InfoUserHandle>
      </InfoUserSection>

      <InfoStatsRow>
        <InfoStatItem>
          <InfoStatValue>{displayUser?.rank || "-"}</InfoStatValue>
          <InfoStatLabel>Current Rank</InfoStatLabel>
        </InfoStatItem>
        <InfoStatItem>
          <InfoStatValue>{displayUser?.activityXP || "0"}</InfoStatValue>
          <InfoStatLabel>XP Range</InfoStatLabel>
        </InfoStatItem>
        <InfoStatItem>
          <InfoStatValue>{displayUser?.rating || "0"}</InfoStatValue>
          <InfoStatLabel>Rating</InfoStatLabel>
        </InfoStatItem>
      </InfoStatsRow>

      <InfoDetailsSection>
        <InfoDetailRow>
          <InfoDetailIcon>V</InfoDetailIcon>
          <InfoDetailLabel>Verification</InfoDetailLabel>
          <InfoDetailValue isVerified={!!displayUser?.verificationStatus}>
            {displayUser?.verificationStatus ? "Verified" : "Not Verified"}
          </InfoDetailValue>
        </InfoDetailRow>
        <InfoDetailRow>
          <InfoDetailIcon>D</InfoDetailIcon>
          <InfoDetailLabel>Date Joined</InfoDetailLabel>
          <InfoDetailValue>
            {displayUser?.createDate
              ? new window.Date(String(displayUser.createDate)).toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )
              : "-"}
          </InfoDetailValue>
        </InfoDetailRow>
        <InfoDetailRow>
          <InfoDetailIcon>L</InfoDetailIcon>
          <InfoDetailLabel>Location</InfoDetailLabel>
          <InfoDetailValue>
            {displayUser?.regionData?.country ||
              displayUser?.regionData?.region ||
              "-"}
          </InfoDetailValue>
        </InfoDetailRow>
      </InfoDetailsSection>
    </InfoPage>
  );
};

export default ChatInfoPage;
