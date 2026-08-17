import React, { FC } from "react";
import { ChevronLeft, CheckCircle, XCircle, MapPin, Star } from "lucide-react";
import imageLoader from "../../../../../../../helpers/imageLoader";
import UserAvatar from "../../../../../../global/common/UserAvatar";
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
  const displayName = getSupportAwareName(displayUser, "Grace Miller");
  const displayAvatar = getSupportAwareAvatar(
    displayUser,
    displayUser?.photo
      ? imageLoader(displayUser.photo)
      : displayUser?.twitterData?.photo || "/static/default-avatar.png"
  );
  const displayHandle = getSupportAwareHandle(displayUser);

  return (
    <InfoPage>
      <InfoHeader>
        <BackButton onClick={onBack}>
          <ChevronLeft size={24} />
        </BackButton>
        <InfoTitle>Info</InfoTitle>
      </InfoHeader>

      <InfoUserSection>
        <UserAvatar
          avatar={displayAvatar}
          size="big"
          variant="default"
          name={displayName}
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
          <InfoStatValue>
            <p>
              <Star width={16} fill={"#FFC702"} stroke={"#FFC702"} />
              {displayUser?.rating || "93"}
              /100
            </p>
            <p style={{ marginTop: "4px" }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.3327 2.66602H4.12056V8.23123H13.3327L11.8781 5.44862L13.3327 2.66602Z"
                  fill="#FF5858"
                />
                <path
                  d="M2.66602 13.3327H5.57511M4.12056 8.23123V2.66602H13.3327L11.8781 5.44862L13.3327 8.23123H4.12056ZM4.12056 8.23123V12.8689"
                  stroke="#FF5858"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {displayUser?.redFlags || "0"}
            </p>
          </InfoStatValue>
          <InfoStatValue isRed></InfoStatValue>
        </InfoStatItem>
      </InfoStatsRow>

      <InfoDetailsSection>
        <InfoDetailRow>
          <InfoDetailIcon>
            {displayUser?.verificationStatus ? (
              <CheckCircle size={20} color="#04A584" />
            ) : (
              <XCircle size={20} color="#FF5858" />
            )}
          </InfoDetailIcon>
          <InfoStatItem className="left">
            <InfoDetailValue isVerified={displayUser?.verificationStatus || false}>
              {displayUser?.verificationStatus ? "Verified" : "Not Verified"}
            </InfoDetailValue>
            <InfoDetailLabel>Verification</InfoDetailLabel>
          </InfoStatItem>
        </InfoDetailRow>

        <InfoDetailRow>
          <InfoDetailIcon>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.55952 8.91425H16.75M6.55952 3V4.54304M16.75 3V4.54285M19.75 7.24285V18.3C19.75 19.7912 18.5561 21 17.0833 21H6.41667C4.94391 21 3.75 19.7912 3.75 18.3V7.24285C3.75 5.75168 4.94391 4.54285 6.41667 4.54285H17.0833C18.5561 4.54285 19.75 5.75168 19.75 7.24285Z"
                stroke="#070B35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </InfoDetailIcon>
          <InfoStatItem className="left">
            <InfoDetailValue>
              {displayUser?.createDate
                ? new window.Date(
                  String(displayUser.createDate)
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
                : "-"}
            </InfoDetailValue>
            <InfoDetailLabel>Date Joined</InfoDetailLabel>
          </InfoStatItem>
        </InfoDetailRow>

        <InfoDetailRow>
          <InfoDetailIcon>
            <MapPin size={20} color="#728094" />
          </InfoDetailIcon>
          <InfoStatItem className="left">
            <InfoDetailLabel>Location</InfoDetailLabel>
            <InfoDetailValue>
              {displayUser?.regionData?.country ||
                displayUser?.regionData?.region ||
                "-"}
            </InfoDetailValue>
          </InfoStatItem>
        </InfoDetailRow>
      </InfoDetailsSection>
    </InfoPage>
  );
};

export default ChatInfoPage;
