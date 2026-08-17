import styled from "styled-components";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import PersonCard from "../../../../global/PersonCard";
import BaseCard from "../../../../global/common/BaseCard";
import { Button } from "../../../../global/common/Button";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 0 auto;
  margin-top: 32px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const UserAvatarWrapper = styled(UserAvatar)`
  @media (max-width: 767px) {
    width: 48px !important;
    height: 48px !important;

    span {
      font-size: 14px;
      line-height: 17px;
      width: 26px;
      height: 26px;
    }
  }

  img {
    width: 100%;
    height: 100%;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 20px;
  margin-bottom: 16px;
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

  @media (max-width: 767px) {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29px;
    width: 220px;
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

  @media (max-width: 767px) {
    flex-direction: column;
  }
`;

export const SocialsWrapper = styled.div`
  display: flex;
  gap: 12px;
`;

export const HeaderDataWrapper = styled.div`
  display: flex;
  gap: 34px;
  align-items: center;

  @media (max-width: 1024px) {
    justify-content: space-between;
    width: 100%;
  }
  @media (max-width: 767px) {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
`;

export const HeaderDataRightWrapper = styled.div`
  display: flex;
  gap: 34px;

  @media (max-width: 767px) {
    justify-content: flex-start;
    gap: 10px;
  }
`;

export const ActionsWrapper = styled.div`
  display: flex;
  gap: 24px;

  @media (max-width: 767px) {
    gap: 10px;
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

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;

    i {
      font-size: 14px;
      line-height: 16px;
    }
  }

  span {
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
  }
`;

export const PersonCardWrapper = styled(PersonCard)`
  height: 100%;
`;

export const CommentsWrapper = styled.div`
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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

export const HeaderDateWrapper = styled.div`
  display: flex;
  flex-direction: column;

  p {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
  }

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 16px;
  }
`;

export const GraphicWrapper = styled.div`
  margin-bottom: 40px;
  gap: 16px;
  display: flex;
  justify-content: space-between;

  & > div:first-child {
    width: calc(100% - 306px);
  }
  & > div:last-child {
    width: 290px;

    @media (max-width: 1210px) {
      width: 100%;
      margin: 16px;
    }
  }

  @media (max-width: 1210px) {
    flex-direction: column;
    justify-content: center;
    align-items: center;

    & > div:first-child {
      width: 100%;
    }
  }
`;

export const GraphicHeaderWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  margin-bottom: 16px;
  flex-direction: column;

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
    margin-bottom: 16px;

    @media (max-width: 767px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }

  .chart {
    display: block;
    width: 100%;
  }
`;

export const GraphicHeaderButtonsWrapper = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

export const GraphicHeaderButton = styled.button<{ active: boolean }>`
  padding: 8px 10px;
  border-radius: 8px;
  background: ${({ active }) =>
    active ? "rgba(0, 192, 153, 0.1)" : "rgba(115, 128, 148, 0.05)"};
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: ${({ active }) => (active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)")};
`;

export const GraphicHeaderTagsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;

  @media (max-width: 767px) {
    margin-left: 14px;
  }

  div {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    position: relative;

    &:first-child::before {
      content: " ";
      background: var(--color-danger);
      width: 8px;
      height: 8px;
      border-radius: 100px;
      position: absolute;
      z-index: 2;
      top: 4px;
      left: -12px;
    }

    &:last-child::before {
      content: " ";
      background: var(--color-info);
      width: 8px;
      height: 8px;
      border-radius: 100px;
      position: absolute;
      z-index: 2;
      top: 4px;
      left: -12px;
    }
  }
`;

export const GraphicDataTitle = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  margin-bottom: 8px;
  text-align: center;
`;

export const GraphicDataDescription = styled.p`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  text-align: center;
  margin-bottom: 8px;
`;

export const GraphicDataAccounts = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;

  div {
    p {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      color: var(--color-text-muted);
    }
    input {
      background: #f8f8f9;
      border-radius: 8px;
      border: none;
      width: 100%;
      padding: 9px 8px;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
      color: var(--color-text-primary);
    }
  }
`;

export const GraphicDataProgress = styled.div<{ value: number }>`
  margin-bottom: 16px;

  div:first-child {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    p {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      color: var(--color-text-muted);
      margin-bottom: 6px;
    }
    span {
      font-weight: var(--font-weight-semibold);
      font-size: 32px;
      line-height: 40px;
      color: var(--color-primary);
    }
  }

  div:last-child {
    background: rgba(39, 122, 210, 0.1);
    border-radius: 8px;
    width: 100%;
    height: 8px;

    div {
      width: ${({ value }) => value}%;
      height: 8px;
      background: var(--color-primary);
      border-radius: 8px;
    }
  }
`;

export const GraphicDataUsersList = styled.div`
  background: #f8f8f9;
  border-radius: 8px;
  max-height: 300px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  margin-bottom: 10px;

  & > div {
    display: flex;
    gap: 10px;
    align-items: center;

    div {
      p {
        font-weight: var(--font-weight-semibold);
        font-size: 14px;
        line-height: 17px;
      }
      span {
        font-weight: var(--font-weight-regular);
        font-size: 14px;
        line-height: 16px;
        color: var(--color-text-muted);
      }
    }
  }
`;

export const GraphicDataUsersListTitle = styled.p`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
`;

export const ScoreWrapper = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 40px;

  @media (max-width: 1210px) {
    & > div {
      width: calc(50% - 8px) !important;
    }
  }
  @media (max-width: 767px) {
    & > div {
      width: 100% !important;
    }
  }
`;

export const ScoreTitle = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 21px;
  margin-bottom: 9px;

  span {
    margin-left: 6px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }
`;

export const ScoreValue = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 64px;
  line-height: 77px;
  margin-bottom: 8px;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 18px;
    line-height: 21px;
    vertical-align: top;
    color: var(--color-primary);
    svg {
      transform: rotate(180deg);
      width: 11px;
      height: 11px;
    }
  }
`;

export const ScoreProgress = styled.div`
  margin-bottom: 9px;
  background: linear-gradient(90deg, var(--color-danger) 0%, var(--color-warning) 50.62%, var(--color-primary) 100%);
  border-radius: 8px;
  width: 100%;
  height: 6px;
`;

export const ScoreProgressPoints = styled.div`
  display: flex;
  justify-content: space-between;
  padding-right: 30px;

  div {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    position: relative;

    &::before {
      content: " ";
      position: absolute;
      top: -20px;
      left: 45%;
      background: white;
      border-radius: 99px;
      border: 1px solid #ecedf0;
      height: 16px;
      width: 4px;
    }
  }
`;

export const UsersScoreTitle = styled.div<{ delta: number }>`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;

  p:first-child {
    font-weight: var(--font-weight-semibold);
    font-size: 18px;
    line-height: 21px;
  }

  p:last-child {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
      color: ${({ delta }) => (delta > 0 ? "var(--color-primary)" : "var(--color-danger)")};
      display: flex;
      gap: 2px;
      align-items: center;

      svg {
        width: 11px;
        height: 11px;
        transform: rotate(${({ delta }) => (delta > 0 ? "180deg" : "0")});

        path {
          fill: ${({ delta }) => (delta > 0 ? "var(--color-primary)" : "var(--color-danger)")};
        }
      }
    }
  }
`;

export const UsersScoreUserWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  & > div:first-child {
    display: flex;
    gap: 10px;
    align-items: center;

    div {
      p {
        font-weight: var(--font-weight-semibold);
        font-size: 14px;
        line-height: 17px;
      }
      span {
        font-weight: var(--font-weight-regular);
        font-size: 14px;
        line-height: 16px;
        color: var(--color-text-muted);
      }
    }
  }

  & > div:last-child {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
  }
`;

export const UsersScoreUserButton = styled.button`
  width: 100%;
  padding: 8px;
  text-align: center;
  background: var(--color-primary-soft);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-primary);
  margin-bottom: -4px;
`;

export const ScoreBlockWrapper = styled(BaseCard)`
  height: max-content !important;
`;

export const UsersListWrapper = styled.div`
  height: 130px;
  overflow-y: auto;
  margin-bottom: 16px;
`;
