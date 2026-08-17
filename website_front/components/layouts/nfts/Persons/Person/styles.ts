import styled from "styled-components";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import ViewCard from "../../../../global/ViewCard";
import PersonCard from "../../../../global/PersonCard";
import BaseCard from "../../../../global/common/BaseCard";
import { Button } from "../../../../global/common/Button";

export const PageWrapper = styled.div`
  width: 1210px;
  margin: 0 auto;
  margin-top: 32px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const UserAvatarWrapper = styled(UserAvatar)``;

export const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 20px;
`;

export const HeaderInfoWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 1204px) {
    align-items: flex-start;
    justify-content: flex-start;
    flex-direction: column;
    gap: 28px;
  }
`;

export const HeaderUserInfoWrapper = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;

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
      white-space: nowrap;
    }
  }
`;

export const HeaderUserName = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 32px;
  line-height: 39px;
  color: var(--color-text-primary);
  width: 100%;
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
`;

export const SocialsWrapper = styled.div`
  display: flex;
  gap: 12px;
`;

export const HeaderDataWrapper = styled.div`
  display: flex;
  gap: 34px;
  align-items: center;
  flex-wrap: wrap;
`;

export const HeaderDataRightWrapper = styled.div`
  display: flex;
  gap: 34px;
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
`;

export const CurrentRoiDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
`;

export const ActionsWrapper = styled.div`
  display: flex;
  gap: 24px;
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

  span {
    color: var(--color-text-muted);
  }
`;

export const ParticipatedWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 40px;
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
`;

export const FlagsTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);
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
`;

export const CommentsTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);
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
