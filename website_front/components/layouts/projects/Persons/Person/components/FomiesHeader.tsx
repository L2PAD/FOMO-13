import React, { FC } from "react";
import styled from "styled-components";
import UserAvatar from "../../../../../global/common/UserAvatar";
import RatingInfoTooltip from "../../../../../global/common/RatingInfoTooltip";
import Typography from "../../../../../global/common/Typography";
import imageLoader from "../../../../../../helpers/imageLoader";
import { getServiceByUrl } from "../../../../../../helpers/getServiceKeyByUrl";
import SponsoredIcon from "../../../../../global/Icons/SponsoredIcon";
import CrownIcon from "../../../../../global/Icons/CrownIcon";
import VerifyIcon from "../../../../../global/Icons/VerifyIcon";
import { SponsoredWrapper } from "../../../Crypto/Project/styles";
import {
  LeftHeaderColumn,
  LeftHeaderColumnInfo,
  LeftHeaderPersonInfoWrapper,
  HeaderPersonNameWrapper,
  HeaderPersonTitle,
  SponsoredRow,
} from "../../../../gemslab/Profile/styles";
import { HeaderWrapper, RightHeaderColumn } from "../styles";
import {
  FomiesAuthUser,
  FomiesHeaderActionsProps,
  FomiesPersonData,
} from "./types";
import FomiesBadges from "./FomiesBadges";
import FomiesHeaderActions from "./FomiesHeaderActions";

const FomiesHeaderWrapper = styled(HeaderWrapper)`
  margin-top: 0;
  margin-bottom: 20px;
`;

interface Props
  extends Omit<
    FomiesHeaderActionsProps,
    "desktopSocialLinks" | "mobileSocialLinks" | "isOwnProfile" | "mode"
  > {
  personData: FomiesPersonData;
  userData: FomiesAuthUser;
}

const FomiesHeader: FC<Props> = ({
  isActionsPopoverOpen,
  isFollowing,
  isMobile,
  isSocialsPopoverOpen,
  isWatchListProject,
  onCloseActionsPopover,
  onCloseSocialsPopover,
  onDislike,
  onFollowButtonClick,
  onLike,
  onToggleActionsPopover,
  onToggleSocialsPopover,
  onUpdateWatchlist,
  personData,
  userData,
}) => {
  const mobileSocialLinks =
    Array.isArray(userData?.socialNetworks)
      ? userData.socialNetworks.map((item) => ({
        key: getServiceByUrl(item.href),
        href: item.href,
      }))
      : [];

  const desktopSocialLinks = userData?.socialNetworks
    ? Object.values(userData.socialNetworks).map((item) => ({
      key: getServiceByUrl(String(item)),
      href: String(item),
    }))
    : [];

  const isOwnProfile = userData?._id === personData?._id;
  const avatar = !personData.logo
    ? personData?.twitterData?.photo 
    : imageLoader(personData.logo);

  return (
    <FomiesHeaderWrapper>
      <LeftHeaderColumn>
        <LeftHeaderColumnInfo>
          <LeftHeaderPersonInfoWrapper>
            <UserAvatar
              isVerified={!!personData?.verificationStatus}
              size="project-page"
              avatar={avatar}
              name="name"
              variant="success"
              rating={personData?.rating as unknown as number}
            />
            <div>
              <HeaderPersonNameWrapper>
                <HeaderPersonTitle className="title-fomies">
                  {personData?.twitterData?.name || personData?.telegramData?.name}
                  {personData?.verificationStatus ? <VerifyIcon /> : <></>}
                </HeaderPersonTitle>
                <RatingInfoTooltip />
                {/* {!isMobile && <FomiesBadges />} */}
              </HeaderPersonNameWrapper>
              <Typography className="green-color" variant="h3">
                @{personData?.username || personData?.twitterData?.username}
              </Typography>
            </div>
          </LeftHeaderPersonInfoWrapper>
          {/* {isMobile && <FomiesBadges />} */}
          <SponsoredRow>
            {/* <SponsoredWrapper>
              <CrownIcon />
              <span>FOMO Choice</span>
            </SponsoredWrapper>
            <SponsoredWrapper>
              <SponsoredIcon />
              <span>Sponsored</span>
            </SponsoredWrapper> */}
          </SponsoredRow>
        </LeftHeaderColumnInfo>
        <FomiesHeaderActions
          desktopSocialLinks={desktopSocialLinks}
          isActionsPopoverOpen={isActionsPopoverOpen}
          isFollowing={isFollowing}
          isMobile={isMobile}
          mode={isMobile ? "mobile" : "toolbar"}
          isOwnProfile={isOwnProfile}
          isSocialsPopoverOpen={isSocialsPopoverOpen}
          isWatchListProject={isWatchListProject}
          mobileSocialLinks={mobileSocialLinks}
          onCloseActionsPopover={onCloseActionsPopover}
          onCloseSocialsPopover={onCloseSocialsPopover}
          onDislike={onDislike}
          onFollowButtonClick={onFollowButtonClick}
          onLike={onLike}
          onToggleActionsPopover={onToggleActionsPopover}
          onToggleSocialsPopover={onToggleSocialsPopover}
          onUpdateWatchlist={onUpdateWatchlist}
          personData={personData}
        />
      </LeftHeaderColumn>
      <RightHeaderColumn>
        <FomiesHeaderActions
          desktopSocialLinks={desktopSocialLinks}
          isActionsPopoverOpen={isActionsPopoverOpen}
          isFollowing={isFollowing}
          isMobile={false}
          mode="right-panel"
          isOwnProfile={isOwnProfile}
          isSocialsPopoverOpen={isSocialsPopoverOpen}
          isWatchListProject={isWatchListProject}
          mobileSocialLinks={mobileSocialLinks}
          onCloseActionsPopover={onCloseActionsPopover}
          onCloseSocialsPopover={onCloseSocialsPopover}
          onDislike={onDislike}
          onFollowButtonClick={onFollowButtonClick}
          onLike={onLike}
          onToggleActionsPopover={onToggleActionsPopover}
          onToggleSocialsPopover={onToggleSocialsPopover}
          onUpdateWatchlist={onUpdateWatchlist}
          personData={personData}
        />
      </RightHeaderColumn>
    </FomiesHeaderWrapper>
  );
};

export default FomiesHeader;
