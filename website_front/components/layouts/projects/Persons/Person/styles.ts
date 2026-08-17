import styled from "styled-components";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import ViewCard from "../../../../global/ViewCard";
import PersonCard from "../../../../global/PersonCard";
import BaseCard from "../../../../global/common/BaseCard";
import { Button } from "../../../../global/common/Button";
import {
  ProfilePageShell,
  profileDarkMetricItemStyles,
  profileDarkMetricsGridStyles,
  profileHeaderGridStyles,
  profileMetricItemStyles,
  profileMetricsGridStyles,
  profileSurfaceStyles,
} from "../../shared/ProfilePageShell";

export const PageWrapper = styled(ProfilePageShell)``;

export const HeaderDataWrapper = styled.div`
  ${profileMetricsGridStyles}
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-self: stretch;
  width: 100%;
  gap: 2px;

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    margin-top: 0;
    margin-bottom: 0;
  }
`;

export const HeaderItem = styled.div`
  ${profileMetricItemStyles}
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;

  & .value {
    display: flex;
    gap: 4px;
    align-items: center;
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29.4px;

    @media (max-width: 768px) {
      justify-content: flex-end;
      font-size: 18px;
      line-height: 24px;
      font-weight: var(--font-weight-semibold);
    }

    & .categories {
      color: var(--color-primary);
      width: 25px;
      height: 25px;
      border-radius: 50%;
      background: var(--color-surface-subtle);
      border: 1px solid #eef2f6;
      margin-left: 8px;
      flex: 0 0 25px;
    }
  }

  & .key {
    font-size: 14px;
    color: var(--main-gray);

    @media (max-width: 768px) {
      font-size: 14px;
      color: #95a4b7;
      text-align: left;
    }
  }

  &.small-item {
    gap: 0px;

    & .value {
      font-size: 14px;

      & .region-value {
        color: var(--main-black);
      }
    }

    @media (max-width: 768px) {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 14px;
      border-radius: 8px;
      background-color: var(--color-white);
      box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.05);
      margin-bottom: 0;

      & .key {
        order: 1;
      }

      & .value {
        order: 2;
        font-size: 16px;
        font-weight: var(--font-weight-semibold);
      }
    }
  }

  &.description-item {
    & .key {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  @media (max-width: 768px) {
    &,
    &.small-item {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      margin-bottom: 0;
      background: none;
      box-shadow: none;
      font-size: 14px;
      font-weight: var(--font-weight-medium);

      border-radius: 0;

      & .key {
        order: 1;
      }

      & .value {
        order: 2;
        font-size: 14px;
        line-height: 16px;
        font-weight: var(--font-weight-semibold);
      }

      &:not(:first-child) {
        border-top: 1px solid #e6e8eb;
      }

      &:has(input) {
        flex-direction: column-reverse;
        align-items: flex-start;
        gap: 0px;

        input {
          width: 100% !important;
          background: var(--color-white);
        }
      }
    }
  }

  &.profile-item {
    & .key {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
    }
    & .region-value {
      color: var(--main-black);
    }

    & .value {
      font-size: 14px;
    }

    @media (max-width: 768px) {
      display: flex;
      flex-direction: column-reverse;
      width: calc(100% / 3 - 8px);
      gap: 0px;
      border-top: 1px solid #e6e8eb;
    }

    @media (max-width: 480px) {
      width: calc(50% - 8px);
      max-width: calc(50% - 8px);
    }
  }
`;

export const UserAvatarWrapper = styled(UserAvatar)``;

export const HeaderWrapper = styled.div`
  ${profileSurfaceStyles}
  ${profileHeaderGridStyles}
  margin-top: 10px;
  position: relative;

  @media (max-width: 768px) {
    .social-links {
      display: none;
    }
  }
`;

export const HeaderInfoWrapper = styled.div`
  width: 100%;
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;

  @media (max-width: 1024px) {
    width: 100%;
  }

  @media (max-width: 768px) {
    align-items: flex-start;
    justify-content: flex-start;
    flex-direction: column;
    gap: 0;
  }
`;

export const HeaderUserInfoWrapper = styled.div`
  display: flex;
  min-width: 0;
  gap: 20px;
  align-items: center;

  > div:last-child {
    min-width: 0;
  }

  @media (max-width: 500px) {
    & > div:first-child,
    & > div:first-child * {
      max-width: 75px;
      max-height: 75px;
    }
  }

  p {
    @media (max-width: 500px) {
      font-size: 24px;
    }
  }

  span {
    @media (max-width: 500px) {
      font-size: 13px;
      white-space: normal;
    }
  }
`;

export const HeaderUserName = styled.div`
  display: flex;
  min-width: 0;
  gap: 6px;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 32px;
  line-height: 39px;
  color: var(--color-text-primary);
  width: 100%;

  p {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  @media (max-width: 768px) {
    max-width: 100%;
  }
  @media (max-width: 480px) {
    font-size: 24px;
    line-height: 30px;
    flex-wrap: wrap;
  }
`;

export const RatingCircleWrapper = styled.div`
  margin-top: -10px;
`;

export const HeaderUserDescriptionWrapper = styled.div`
  margin-top: 4px;
  display: flex;
  gap: 12px;
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-muted);

  @media (max-width: 768px) {
    font-size: 14px;
    line-height: 18px;

    input {
      width: 100% !important;
    }

    span {
      width: 100%;
      word-break: break-word;
    }
  }
`;

export const SocialsWrapper = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 480px) {
    flex-wrap: wrap;
  }
`;

export const HeaderDataRightWrapper = styled.div`
  display: flex;
  gap: 34px;

  @media (max-width: 768px) {
    gap: 20px;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 15px;
  }
`;

export const HeaderDataFollowersWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const HeaderDataFollowersTitle = styled(Typography)`
  display: flex;
  gap: 4px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  align-items: center;
`;

export const HeaderDataFollowersItemsWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 480px) {
    flex-wrap: wrap;
  }
`;

export const HeaderDataFollowersItem = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

export const CurrentRoiValue = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-primary);
  margin-bottom: 4px;

  @media (max-width: 480px) {
    font-size: 20px;
    line-height: 24px;
  }
`;

export const CurrentRoiDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
`;

export const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;

  @media (max-width: 480px) {
    gap: 15px;
    flex-wrap: wrap;
  }
`;

export const ActionButton = styled.button`
  background: none;
  border: none;
  svg {
    height: 30px;
    width: 30px;
  }
`;

export const HeaderDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: inherit !important;
  margin-left: 10px !important;
  span {
    color: var(--color-text-muted);
  }

  @media (max-width: 480px) {
    font-size: 14px;
    line-height: 18px;
    margin-left: 0 !important;
  }
`;

export const HeaderHtmlBio = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: inherit !important;
  margin-left: 10px !important;
  span {
    color: var(--color-text-muted);
  }

  @media (max-width: 480px) {
    font-size: 14px;
    line-height: 18px;
    margin-left: 0 !important;
  }
`;

export const EditItemWrapper = styled.div``;

export const ParticipatedWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 40px;

  @media (max-width: 768px) {
    margin-top: 30px;
  }
`;

export const ParticipatedHeaderWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const ParticipatedActionsWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

export const ParticipatedTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);

  @media (max-width: 480px) {
    font-size: 18px;
    line-height: 22px;
  }
`;

export const ParticipatedAction = styled.button<{ rotate: boolean }>`
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 2px 2px 0 #eeeeee;
  border-radius: 8px;
  padding: 8px;
  font-size: 0;
  margin-top: -5px;
  cursor: pointer;
  max-height: 32px;

  svg {
    width: 16px;
    height: 16px;
    transform: ${({ rotate }) => (rotate ? "rotate(45deg)" : "")};
  }
`;

export const NFTsWrapper = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 5px;
  padding-right: 5px;

  @media (max-width: 768px) {
    gap: 10px;
  }
`;

export const NFTProject = styled(ViewCard)`
  height: 100%;
`;
export const PersonCardWrapper = styled(PersonCard)`
  height: 100%;
`;

export const FlagsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 40px;

  @media (max-width: 768px) {
    margin-top: 30px;
  }
`;

export const FlagsTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);

  @media (max-width: 480px) {
    font-size: 18px;
    line-height: 22px;
  }
`;

export const FlagsListsWrapper = styled.div`
  display: flex;
  margin-top: 16px;
  gap: 50px;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 32px;
  }
`;

export const FlagsList = styled.div`
  width: 375px;
  margin-left: 12px;

  @media (max-width: 768px) {
    width: 100%;
    margin-left: 0;
  }
`;

export const FlagsListTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-muted);
  margin-bottom: 12px !important;
`;

export const FlagsListItem = styled.li`
  display: flex;
  gap: 6px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-primary);
  width: max-content;
  align-items: center;
  margin-bottom: 12px;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

export const CommentsWrapper = styled.div`
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 768px) {
    margin-top: 30px;
  }
`;

export const CommentsTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);

  @media (max-width: 480px) {
    font-size: 18px;
    line-height: 22px;
  }
`;

export const CommentsContent = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 12px;
  }
`;

export const CommentsItems = styled(BaseCard)`
  overflow-y: auto;
  max-height: 320px;
  width: 50% !important;
  padding-top: 0 !important;

  @media (max-width: 1024px) {
    width: 100% !important;
  }
`;

export const AddNewCommentsWrapper = styled(BaseCard)`
  width: 50% !important;
  height: max-content;

  @media (max-width: 1024px) {
    width: 100% !important;
  }
`;

export const NewCommentTextarea = styled.textarea`
  resize: none;
  background: #f8f8f9;
  border-radius: 8px;
  border: none;
  width: 100%;
  height: 160px;
  padding: 9px 12px;
  margin-bottom: 20px;
`;

export const NewCommentButton = styled(Button)`
  width: 100%;
  padding: 13px !important;
`;

export const HeaderItems = styled.div`
  ${profileMetricsGridStyles}
  ${profileDarkMetricsGridStyles}
  margin: 24px 0 0;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  align-items: stretch;
  gap: 2px;

  > ${HeaderItem} {
    ${profileDarkMetricItemStyles}
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 768px) {
    margin: 18px 0 0;
    grid-template-columns: minmax(0, 1fr);
    gap: 0;

    & > div {
      width: 100%;
    }
  }
`;

export const RightHeaderColumn = styled.div`
  width: 100%;
  min-width: 0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;

  @media (max-width: 1024px) {
    width: 100%;
  }

  & .buttons {
    display: grid;
    grid-template-columns: 1fr 1fr 0.1fr;
    gap: 20px;
    align-items: center;
    margin-bottom: 12px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr 1fr;
      order: 2;

      & .menu-btn {
        position: absolute;
        top: 0;
        right: 0;
        width: 40px;
        height: 40px;
        background: #f0f0f0;
      }
    }

    button {
      border-radius: 4px !important;
      font-size: 14px;
    }
  }

  & .followers-data {
    display: grid;
    grid-template-columns: 1fr 1fr;

    @media (max-width: 768px) {
      display: none;
    }

    & .followers-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    & .followers-value {
      font-weight: var(--font-weight-semibold);
      font-size: 24px;

      @media (max-width: 480px) {
        font-size: 18px;
      }
    }

    & .followers-key {
      font-size: 24px;
      color: var(--main-gray);

      @media (max-width: 480px) {
        font-size: 16px;
      }
    }
  }
`;

export const PortfolioSnapshot = styled.div`
  max-width: 100%;
  width: 100%;
`;

export const Overview = styled.div`
  display: flex;
  gap: 20px;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;
