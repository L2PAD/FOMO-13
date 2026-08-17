import styled from "styled-components";
import Typography from "../Typography";

export const ReviewWrapper = styled.div`
  height: 100%;
  display: flex;
`;

export const Line = styled.div`
  display: block;
  background: #b9bfc9;
  min-height: 100%;
  width: 1px;
  margin: 0px 20px;
`;

export const CommentWrapper = styled.div``;

export const HeaderWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const Title = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  line-height: 17px;
  font-size: 14px;
  color: var(--color-text-primary);

  span {
    font-weight: var(--font-weight-regular);
    color: var(--color-text-muted);
    font-size: 12px;
  }
`;

export const DateText = styled(Typography)`
  margin-top: 4px !important;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
`;

export const CommentText = styled(Typography)`
  margin-top: 9px !important;
  color: var(--color-text-primary);
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

export const UserReviews = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;
export const Reviews = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-left: 5px;

  button {
    display: flex;
    align-items: center;
    gap: 3px;
    font-weight: var(--font-weight-semibold);
    cursor: default;

    img {
      width: 24px;
      height: 24px;
    }
  }
`;

export const ReviewText = styled.div`
  margin: 12px 0;
`;
