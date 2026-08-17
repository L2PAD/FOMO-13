import styled from "styled-components";
import Typography from "../Typography";

export const CommentWrapper = styled.div`
  margin-bottom: 20px;
`;

export const HeaderWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;

  & .user-actions {
    width: 100%;
  }
`;

export const Title = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  line-height: 17px;
  font-size: 14px;
  color: var(--color-text-primary);
  margin-bottom: 4px !important;
  span {
    font-weight: var(--font-weight-regular);
    color: var(--color-text-muted);
    font-size: 12px;
  }
`;

export const DateText = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
`;

export const CommentText = styled(Typography)`
  margin-top: 9px !important;
  color: #0d0f2a;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  overflow: auto !important;
  white-space: normal !important;
`;

export const GrayLine = styled.div`
  height: 2px;
  background: #f8f8f9;
  margin-top: 16px;
`;

export const ReactionsWrapper = styled.div`
  padding-top: 8px;
  gap: 10px;
  display: flex;
`;

export const ReactionButton = styled.button`
  background: #f8f8f9;
  border-radius: 99px;
  border: none;
  padding: 4px 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);
  cursor: pointer;
`;

export const ModalContent = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100%;
  margin-top: 8px;
`;

export const ModalTitle = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
`;

export const ModalActionsWrapper = styled.div`
  display: flex;
  width: 100%;
  gap: 13px;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
`;

export const ModalAction = styled.button`
  background: #f8f8f9;
  border-radius: 8px;
  border: none;
  width: 100%;
  height: 190px;
  font-size: 80px;

  svg {
    width: 80px;
    height: 80px;
  }
`;

export const ModalCancelButton = styled.button`
  border: none;
  background: none;
  margin-top: 20px;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-primary);
`;

export const CommentActions = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 45px;

  button {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: var(--font-weight-semibold);

    img {
      width: 18px;
      height: 18px;
    }
  }
`;

export const TitleWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  & .title-buttons {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  & .report-wrapper {
    position: relative;
  }

  & .delete-wrapper {
    position: relative;
  }

  & .remove-btn {
    svg {
      width: 12px;
      height: 12px;
    }
  }

  & .report-description-modal {
    position: absolute;
    top: 25px;
    left: -180px;
    padding: 10px;
    width: 200px;

    div {
      font-weight: var(--font-weight-regular);
      font-size: 12px;
      color: var(--main-gray);
    }
  }

  & .remove-description-modal {
    position: absolute;
    top: 25px;
    left: -125px;
    padding: 10px;
    width: 140px;

    div {
      font-weight: var(--font-weight-regular);
      font-size: 12px;
      color: var(--main-gray);
    }
  }
`;

export const DeleteCommentWrapper = styled.div`
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;

  & .delete-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 20px 0;

    h4 {
      font-family: 600;
      font-size: 16px;
    }

    p {
      font-size: 16px;
    }
  }

  & .buttons {
    display: flex;
    align-items: center;
    gap: 25px;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 4px;
    padding: 6px;
    font-weight: var(--font-weight-regular);
    font-size: 10px;
    line-height: 100%;
    width: 120px;
    height: 28px;
  }
  & .red-btn {
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
    transition: all 0.3s ease;

    &:hover {
      border: 1px solidrgb(33, 34, 34);
      span {
        color: #e62727;
      }

      path {
        stroke: #e62727;
      }
    }

    &:active {
      border: 1px solid #c71919;
      span {
        color: #c71919;
      }

      path {
        stroke: #c71919;
      }
    }
  }

  & .green-btn {
    transition: all 0.3s ease;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);

    span {
      font-size: 10px !important;
    }

    &:hover {
      border: 1px solid #39816a;
      span {
        color: #39816a;
      }

      path {
        stroke: #39816a;
      }
    }

    &:active {
      border: 1px solid #2e6a58;
      span {
        color: #2e6a58;
      }

      path {
        stroke: #2e6a58;
      }
    }
  }
`;
