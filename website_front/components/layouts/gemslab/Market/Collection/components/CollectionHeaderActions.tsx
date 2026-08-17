import React from "react";
import Image from "next/image";
import { Link, Star } from "lucide-react";
import { FlagIcon } from "../../../../../global/Icons";
import SocialLinks from "../../../../../global/common/SocialLinks";
import dislikeDefault from "../../../../../../assets/icons/otc/dislike-default.svg";
import {
  ActionsPopover,
  ActionsPopoverTrigger,
  PopoverActionsContainer,
  PopoverOverlay,
  ProjectActions,
  SocialsWrapper,
} from "../../../../projects/Crypto/Project/crypto-styles";

export type CollectionFlagColor = "green" | "yellow" | "red";

interface CollectionHeaderActionsProps {
  isMobile: boolean;
  isActionsPopoverOpen: boolean;
  isSocialsPopoverOpen: boolean;
  socialLinks: Array<{ href: string; key: string }>;
  isInWatchlist: boolean;
  isInFavorites: boolean;
  isLiked: boolean;
  isDisliked: boolean;
  activeFlag: CollectionFlagColor | null;
  onActionsToggle: () => void;
  onActionsClose: () => void;
  onSocialsToggle: () => void;
  onSocialsClose: () => void;
  onWatchlist: () => void;
  onFavorites: () => void;
  onLike: () => void;
  onDislike: () => void;
  onFlag: (color: CollectionFlagColor) => void;
}

const flagFill = (
  activeFlag: CollectionFlagColor | null,
  color: CollectionFlagColor
) => (activeFlag === color ? { opacity: 1, fontWeight: "var(--font-weight-semibold)" } : { opacity: 0.6, fontWeight: "var(--font-weight-regular)" });

export const CollectionHeaderActions: React.FC<CollectionHeaderActionsProps> = ({
  isMobile,
  isActionsPopoverOpen,
  isSocialsPopoverOpen,
  socialLinks,
  isInWatchlist,
  isInFavorites,
  isLiked,
  isDisliked,
  activeFlag,
  onActionsToggle,
  onActionsClose,
  onSocialsToggle,
  onSocialsClose,
  onWatchlist,
  onFavorites,
  onLike,
  onDislike,
  onFlag,
}) => {
  if (isMobile) {
    return (
      <>
        <div>
          <ActionsPopoverTrigger data-popover-trigger onClick={onActionsToggle}>
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
              <PopoverOverlay onClick={onActionsClose} />
              <ActionsPopover className="market" data-popover-trigger>
                <PopoverActionsContainer>
                  <button
                    onClick={() => {
                      onWatchlist();
                      onActionsClose();
                    }}
                    style={{
                      opacity: isInWatchlist ? 1 : 0.6,
                      fontWeight: isInWatchlist ? 600 : 400,
                    }}
                  >
                    <Star size={20} color={isInWatchlist ? "#04A584" : "#000"} />
                    <span>
                      {isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      onFavorites();
                      onActionsClose();
                    }}
                    style={{
                      opacity: isInFavorites ? 1 : 0.6,
                      fontWeight: isInFavorites ? 600 : 400,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill={isInFavorites ? "#04A584" : "none"}
                    >
                      <path
                        d="M1 17H5.36364M3.18182 9.34783V1H17L14.8182 5.17391L17 9.34783H3.18182ZM3.18182 9.34783V16.3043"
                        stroke="#04A584"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>
                      {isInFavorites ? "Remove from Favorites" : "Add to Favorites"}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      onLike();
                      onActionsClose();
                    }}
                    style={{
                      opacity: isLiked ? 1 : 0.6,
                      fontWeight: isLiked ? 600 : 400,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill={isLiked ? "#04A584" : "none"}
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.66667 6.33333H13.6367C13.9207 6.33334 14.2001 6.40595 14.4482 6.54427C14.6963 6.68259 14.9049 6.88202 15.0543 7.12364C15.2036 7.36525 15.2888 7.64104 15.3016 7.9248C15.3144 8.20857 15.2545 8.4909 15.1275 8.745L12.2108 14.5783C12.0724 14.8554 11.8595 15.0884 11.596 15.2512C11.3325 15.414 11.0289 15.5001 10.7192 15.5H7.37167C7.23583 15.5 7.1 15.4833 6.9675 15.45L3.83333 14.6667M9.66667 6.33333V2.16667C9.66667 1.72464 9.49107 1.30072 9.17851 0.988155C8.86595 0.675595 8.44203 0.5 8 0.5H7.92083C7.50417 0.5 7.16667 0.8375 7.16667 1.25417C7.16667 1.84917 6.99083 2.43083 6.66 2.92583L3.83333 7.16667V14.6667M9.66667 6.33333H8M3.83333 14.6667H2.16667C1.72464 14.6667 1.30072 14.4911 0.988155 14.1785C0.675595 13.866 0.5 13.442 0.5 13V8C0.5 7.55797 0.675595 7.13405 0.988155 6.82149C1.30072 6.50893 1.72464 6.33333 2.16667 6.33333H4.25"
                        stroke="#04A584"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Like</span>
                  </button>
                  <button
                    onClick={() => {
                      onDislike();
                      onActionsClose();
                    }}
                    style={{
                      opacity: isDisliked ? 1 : 0.6,
                      fontWeight: isDisliked ? 600 : 400,
                    }}
                  >
                    <Image
                      src={dislikeDefault}
                      alt="Dislike"
                      width={20}
                      height={20}
                      style={{
                        filter: isDisliked
                          ? "brightness(0) saturate(100%) invert(40%) sepia(99%) saturate(2355%) hue-rotate(332deg) brightness(100%) contrast(102%)"
                          : "none",
                      }}
                    />
                    <span>Dislike</span>
                  </button>
                  <button
                    onClick={() => {
                      onFlag("green");
                      onActionsClose();
                    }}
                    style={flagFill(activeFlag, "green")}
                  >
                    <FlagIcon
                      stroke="#04A584"
                      fill={activeFlag === "green" ? "#04A584" : "none"}
                    />
                    <span>Green Flag</span>
                  </button>
                  <button
                    onClick={() => {
                      onFlag("yellow");
                      onActionsClose();
                    }}
                    style={flagFill(activeFlag, "yellow")}
                  >
                    <FlagIcon
                      stroke="#FFC702"
                      fill={activeFlag === "yellow" ? "#FFC702" : "none"}
                    />
                    <span>Yellow Flag</span>
                  </button>
                  <button
                    onClick={() => {
                      onFlag("red");
                      onActionsClose();
                    }}
                    style={flagFill(activeFlag, "red")}
                  >
                    <FlagIcon
                      stroke="#FF5858"
                      fill={activeFlag === "red" ? "#FF5858" : "none"}
                    />
                    <span>Red Flag</span>
                  </button>
                </PopoverActionsContainer>
              </ActionsPopover>
            </>
          )}
        </div>
        <div>
          <ActionsPopoverTrigger
            data-popover-trigger
            onClick={onSocialsToggle}
            className="socials-trigger"
          >
            <Link width={20} height={20} color="#738094" />
          </ActionsPopoverTrigger>
          {isSocialsPopoverOpen && (
            <>
              <PopoverOverlay onClick={onSocialsClose} />
              <ActionsPopover className="market" data-popover-trigger>
                <PopoverActionsContainer>
                  <SocialLinks
                    limit={50}
                    className="projects"
                    showLabel
                    links={socialLinks}
                  />
                </PopoverActionsContainer>
              </ActionsPopover>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <ProjectActions className="actions">
        <button
          onClick={onWatchlist}
          style={{
            opacity: isInWatchlist ? 1 : 0.6,
            transform: isInWatchlist ? "scale(1.1)" : "scale(1)",
            transition: "all 0.2s ease",
          }}
        >
          <Star size={20} color={isInWatchlist ? "#04A584" : "#000"} />
        </button>
        <button
          onClick={onLike}
          style={{
            opacity: isLiked ? 1 : 0.6,
            transform: isLiked ? "scale(1.1)" : "scale(1)",
            transition: "all 0.2s ease",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill={isLiked ? "#04A584" : "none"}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.66667 6.33333H13.6367C13.9207 6.33334 14.2001 6.40595 14.4482 6.54427C14.6963 6.68259 14.9049 6.88202 15.0543 7.12364C15.2036 7.36525 15.2888 7.64104 15.3016 7.9248C15.3144 8.20857 15.2545 8.4909 15.1275 8.745L12.2108 14.5783C12.0724 14.8554 11.8595 15.0884 11.596 15.2512C11.3325 15.414 11.0289 15.5001 10.7192 15.5H7.37167C7.23583 15.5 7.1 15.4833 6.9675 15.45L3.83333 14.6667M9.66667 6.33333V2.16667C9.66667 1.72464 9.49107 1.30072 9.17851 0.988155C8.86595 0.675595 8.44203 0.5 8 0.5H7.92083C7.50417 0.5 7.16667 0.8375 7.16667 1.25417C7.16667 1.84917 6.99083 2.43083 6.66 2.92583L3.83333 7.16667V14.6667M9.66667 6.33333H8M3.83333 14.6667H2.16667C1.72464 14.6667 1.30072 14.4911 0.988155 14.1785C0.675595 13.866 0.5 13.442 0.5 13V8C0.5 7.55797 0.675595 7.13405 0.988155 6.82149C1.30072 6.50893 1.72464 6.33333 2.16667 6.33333H4.25"
              stroke="#04A584"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          onClick={onDislike}
          style={{
            opacity: isDisliked ? 1 : 0.6,
            transform: isDisliked ? "scale(1.1)" : "scale(1)",
            transition: "all 0.2s ease",
          }}
        >
          <Image
            src={dislikeDefault}
            alt="Dislike"
            width={20}
            height={20}
            style={{
              filter: isDisliked
                ? "brightness(0) saturate(100%) invert(40%) sepia(99%) saturate(2355%) hue-rotate(332deg) brightness(100%) contrast(102%)"
                : "none",
            }}
          />
        </button>
        <button
          onClick={() => onFlag("green")}
          style={{
            opacity: activeFlag === "green" ? 1 : 0.6,
            transform: activeFlag === "green" ? "scale(1.1)" : "scale(1)",
            transition: "all 0.2s ease",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill={activeFlag === "green" ? "#04A584" : "none"}
          >
            <path
              d="M1 17H5.36364M3.18182 9.34783V1H17L14.8182 5.17391L17 9.34783H3.18182ZM3.18182 9.34783V16.3043"
              stroke="#04A584"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          onClick={() => onFlag("yellow")}
          style={{
            opacity: activeFlag === "yellow" ? 1 : 0.6,
            transform: activeFlag === "yellow" ? "scale(1.1)" : "scale(1)",
            transition: "all 0.2s ease",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill={activeFlag === "yellow" ? "#FFC702" : "none"}
          >
            <path
              d="M1 17H5.36364M3.18182 9.34783V1H17L14.8182 5.17391L17 9.34783H3.18182ZM3.18182 9.34783V16.3043"
              stroke="#FFC702"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          onClick={() => onFlag("red")}
          style={{
            opacity: activeFlag === "red" ? 1 : 0.6,
            transform: activeFlag === "red" ? "scale(1.1)" : "scale(1)",
            transition: "all 0.2s ease",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill={activeFlag === "red" ? "#FF5858" : "none"}
          >
            <path
              d="M1 17H5.36364M3.18182 9.34783V1H17L14.8182 5.17391L17 9.34783H3.18182ZM3.18182 9.34783V16.3043"
              stroke="#FF5858"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </ProjectActions>
      <SocialsWrapper>
        <SocialLinks
          limit={4}
          className="projects"
          links={socialLinks}
        />
      </SocialsWrapper>
    </>
  );
};
