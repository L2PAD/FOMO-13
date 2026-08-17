import styled from "styled-components";
import Typography from "../../../../global/common/Typography";
import Dropdown from "../../../../global/common/Dropdown";
import BaseCard from "../../../../global/common/BaseCard";
import Comment from "../../../../global/common/Comment";
import Tabs from "../../../../global/Tabs";

export const Subtitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
`;

export const TabWrapper = styled.div`
  & > button {
    top: -50px;
    z-index: 10;
  }

  & > p {
    font-size: 18px;
  }

  .separator {
    background: #f8f8f9;
    width: 100%;
    height: 1px;
    margin: 15px 0;
  }

  h3 p {
    font-weight: var(--font-weight-regular);
    margin-top: 5px;
  }

  .table {
    display: flex;
    justify-content: space-between;

    p {
      display: flex;
      align-items: center;
    }
  }
`;
export const DropdownWrapper = styled(Dropdown)`
  border: none !important;
`;

export const HeaderWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const FlexItemWrapper = styled.div`
  display: flex;
  gap: 40px;
  align-items: center;
  font-size: 18px;
  margin: 5px 100px;

  div {
    display: flex;
    gap: 15px;
    align-items: center;
  }
`;

export const ContentWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .content {
    display: grid;
    grid-template-columns: 1fr 4fr;
    gap: 16px;
    border-top: 1px solid #f8f8f9;

    @media (max-width: 950px) {
      grid-template-columns: 185px 1fr;
      gap: 10px;
    }

    @media (max-width: 580px) {
      grid-template-columns: 1fr;
    }

    h3 {
      color: var(--color-text-muted);
    }

    .topic {
      border-right: 1px solid #f8f8f9;
      padding-top: 15px;
      padding-right: 10px;

      & > div {
        display: flex;
        padding: 5px;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
        border-radius: 8px;
        cursor: pointer;

        &:hover {
          background: var(--color-primary)0d;
        }

        & > div {
          display: flex;
          gap: 10px;
          align-items: center;
        }
      }
    }

    .events {
      padding-left: 5px;
      padding-top: 15px;
    }
  }
`;

export const CommentWrapper = styled(BaseCard)`
  width: 100% !important;
  position: relative !important;
  padding: 0 16px 16px 0 !important;
`;

export const CommentItem = styled(Comment)`
  & > div:last-child {
    display: none;
  }

  @media (max-width: 767px) {
    & > div:first-child {
      margin-bottom: 50px;
    }
    & > div:nth-child(3) {
      margin-top: 30px;
    }
  }
`;

export const Buttons = styled(Tabs)`
  border-bottom: 0;
  gap: 10px;
  padding: 10px 0;

  div {
    border-bottom: 0;
    background: var(--color-text-muted)0d;
    border-radius: 8px;

    &.active {
      background: var(--color-primary)1a;
      color: var(--color-primary);
    }
  }
`;

export const ActionsWrapper = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  display: flex;
  gap: 24px;
  align-items: center;

  @media (max-width: 767px) {
    display: none;
  }
`;

export const DefaultActionWrapper = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-primary);
    display: flex;
    gap: 8px;
  }
`;

export const RatingWrapper = styled.i`
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 16px;
    margin-top: -3px;
  }
`;

export const StatusWrapper = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-primary);
  }
`;

export const BlockButton = styled.button`
  border: none;
  background: none;
  padding: 8px 16px;
  background: rgba(0, 192, 153, 0.1);
  border-radius: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-primary);
`;

export const PinButton = styled.button`
  height: 20px;
  width: 20px;
  background: none;
  border: none;

  svg {
    width: 20px;
  }
`;

export const AlertText = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-danger);
  position: absolute;
  top: calc(100% - 45px);
  left: 160px;

  @media (max-width: 767px) {
    top: auto;
    bottom: 55px;
    left: 16px;
  }
`;

export const MobileStatusWrapper = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;

  @media (min-width: 767px) {
    display: none;
  }
`;

export const MobileDataWrapper = styled.div`
  position: absolute;
  top: 56px;
  left: 16px;
  z-index: 2;
  display: flex;
  gap: 24px;
  align-items: center;

  @media (min-width: 767px) {
    display: none;
  }

  @media (max-width: 767px) {
    width: 600px;
    overflow-x: auto;
  }
`;

export const MobileActionsWrapper = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 2;
  display: flex;
  gap: 24px;
  align-items: center;

  @media (min-width: 767px) {
    display: none;
  }
`;

export const BuyContactWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  padding-bottom: 0;

  .buttons {
    display: flex;

    button {
      color: var(--color-text-primary)80;
      font-weight: var(--font-weight-semibold);
    }

    .error {
      color: var(--color-danger);
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
    }
  }

  .likes {
    display: flex;
    gap: 5px;
    font-weight: var(--font-weight-semibold);
    align-items: center;

    .like,
    .dislike {
      padding: 3px 10px;
      border-radius: 99px;
      display: flex;
      gap: 5px;
      align-items: center;
    }

    .dislike {
      background: #f8f8f9;
    }

    .like {
      background: var(--color-primary);
      color: var(--color-white);
    }
  }

  .error {
    color: var(--color-danger);
    font-size: 14px;
    font-weight: var(--font-weight-regular);
  }
`;
