import React, { FC, useState } from "react";
import Image from "next/image";
import { Link } from "lucide-react";
import dislikeDefault from "../../../../../../assets/icons/otc/dislike-default.svg";
import FavButton from "../../../../../global/common/FavButton";
import SocialLinks from "../../../../../global/common/SocialLinks";
import Button from "../../../../../global/common/Button";
import EntityLikes from "../../../../../global/common/EntityLikes";
import ChatModal from "../../../FomoChat/ChatModal";
import {
  ActionsPopover,
  ActionsPopoverTrigger,
  PopoverActionsContainer,
  PopoverOverlay,
  ProjectActions,
} from "../../../Crypto/Project/crypto-styles";
import { CalendarIcon, FlagIcon } from "../../../../../global/Icons";
import { FomiesHeaderActionsProps } from "./types";
import { useTranslation } from "i18n";

const FomiesHeaderActions: FC<FomiesHeaderActionsProps> = ({
  desktopSocialLinks,
  isActionsPopoverOpen,
  isFollowing,
  isMobile,
  mode,
  isOwnProfile,
  isSocialsPopoverOpen,
  isWatchListProject,
  mobileSocialLinks,
  onCloseActionsPopover,
  onCloseSocialsPopover,
  onDislike,
  onFollowButtonClick,
  onLike,
  onToggleActionsPopover,
  onToggleSocialsPopover,
  onUpdateWatchlist,
  personData,
}) => {
  const { translateText } = useTranslation();
  const [isChatModalVisible, setIsChatModalVisible] = useState(false);

  if (mode === "mobile" && isMobile) {
    return (
      <>
        <div>
          <ActionsPopoverTrigger
            data-popover-trigger
            onClick={onToggleActionsPopover}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="13"
              viewBox="0 0 17 13"
              fill="none"
            >
              <path
                d="M5.08378 1H15.1016M5.08378 6.49457H15.1016M5.08378 11.9891H15.1016M1.10156 1V1.01085M1.10156 6.49457V6.50543M1.10156 11.9891V12"
                stroke="#738094"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </ActionsPopoverTrigger>
          {isActionsPopoverOpen && (
            <>
              <PopoverOverlay onClick={onCloseActionsPopover} />
              <ActionsPopover data-popover-trigger>
                <PopoverActionsContainer>
                  <button onClick={onCloseActionsPopover}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                    >
                      <path
                        d="M1 17H5.36364M3.18182 9.34783V1H17L14.8182 5.17391L17 9.34783H3.18182ZM3.18182 9.34783V16.3043"
                        stroke="#04A584"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{translateText("Add to Favorites")}</span>
                  </button>
                  <button onClick={onCloseActionsPopover}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.66667 6.33333H13.6367C13.9207 6.33334 14.2001 6.40595 14.4482 6.54427C14.6963 6.68259 14.9049 6.88202 15.0543 7.12364C15.2036 7.36525 15.2888 7.64104 15.3016 7.9248C15.3144 8.20857 15.2545 8.4909 15.1275 8.745L12.2108 14.5783C12.0724 14.8554 11.8595 15.0884 11.596 15.2512C11.3325 15.414 11.0289 15.5001 10.7192 15.5H7.37167C7.23583 15.5 7.1 15.4833 6.9675 15.45L3.83333 14.6667M9.66667 6.33333V2.16667C9.66667 1.72464 9.49107 1.30072 9.17851 0.988155C8.86595 0.675595 8.44203 0.5 8 0.5H7.92083C7.50417 0.5 7.16667 0.8375 7.16667 1.25417C7.16667 1.84917 6.99083 2.43083 6.66 2.92583L3.83333 7.16667V14.6667M9.66667 6.33333H8M3.83333 14.6667H2.16667C1.72464 14.6667 1.30072 14.4911 0.988155 14.1785C0.675595 13.866 0.5 13.442 0.5 13V8C0.5 7.55797 0.675595 7.13405 0.988155 6.82149C1.30072 6.50893 1.72464 6.33333 2.16667 6.33333H4.25"
                        stroke="#04A584"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{translateText("Like")}</span>
                  </button>
                  <button onClick={onCloseActionsPopover}>
                    <Image
                      src={dislikeDefault}
                      alt="Dislike"
                      width={20}
                      height={20}
                    />
                    <span>{translateText("Dislike")}</span>
                  </button>
                </PopoverActionsContainer>
              </ActionsPopover>
            </>
          )}
        </div>
        <div>
          <ActionsPopoverTrigger
            data-popover-trigger
            onClick={onToggleSocialsPopover}
            className="socials-trigger"
          >
            <Link width={20} height={20} color="#738094" />
          </ActionsPopoverTrigger>
          {isSocialsPopoverOpen && (
            <>
              <PopoverOverlay onClick={onCloseSocialsPopover} />
              <ActionsPopover data-popover-trigger>
                <PopoverActionsContainer>
                  <SocialLinks
                    className="projects"
                    links={mobileSocialLinks}
                    showLabel
                  />
                </PopoverActionsContainer>
              </ActionsPopover>
            </>
          )}
        </div>
      </>
    );
  }

  if (mode === "toolbar") {
    return (
      <ProjectActions>
        <EntityLikes
          likes={personData.likes || []}
          dislikes={personData.dislikes || []}
          onLikeClick={onLike}
          onDislikeClick={onDislike}
        />
      </ProjectActions>
    );
  }

  return (
    <>
      <div className="buttons">
        {isOwnProfile ? (
          <></>
        ) : isFollowing ? (
          <Button variant="outlined" onClick={onFollowButtonClick}>
            {translateText("Unfollow")}
          </Button>
        ) : (
          <Button variant="primary" onClick={onFollowButtonClick}>
            {translateText("Follow")}
          </Button>
        )}
        {isOwnProfile ? (
          <></>
        ) : (
          <Button
            className="contact-btn"
            variant="outlined"
            onClick={() => setIsChatModalVisible(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="15"
              viewBox="0 0 14 15"
              fill="none"
            >
              <path
                d="M4.59961 5.10156H9.39961M4.59961 8.30156H7.39961M13.3996 7.50156C13.3996 8.42158 13.2055 9.29626 12.856 10.0869L13.4008 13.901L10.1322 13.0838C9.20624 13.6045 8.13761 13.9016 6.99961 13.9016C3.46499 13.9016 0.599609 11.0362 0.599609 7.50156C0.599609 3.96694 3.46499 1.10156 6.99961 1.10156C10.5342 1.10156 13.3996 3.96694 13.3996 7.50156Z"
                stroke="#04A584"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {translateText("Contact")}
          </Button>
        )}
      </div>
      <div className="followers-data">
        <div className="followers-item">
          <div className="followers-value">
            {personData?.followers?.length || 0}
          </div>
          <div className="followers-key">{translateText("followers")}</div>
        </div>
        <div className="followers-item">
          <div className="followers-value">
            {personData?.following?.length || 0}
          </div>
          <div className="followers-key">{translateText("following")}</div>
        </div>
      </div>
      <div className="social-links" style={{ margin: "18px 0" }}>
        <SocialLinks className="projects" links={desktopSocialLinks} />
      </div>
      <ChatModal
        initialUserId={personData?._id}
        isVisible={isChatModalVisible}
        setIsVisible={setIsChatModalVisible}
      />
    </>
  );
};

export default FomiesHeaderActions;
