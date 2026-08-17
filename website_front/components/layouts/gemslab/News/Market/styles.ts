import styled from "styled-components";
import Typography from "../../../../global/common/Typography";
import BaseCard from "../../../../global/common/BaseCard";
import { Button } from "../../../../global/common/Button";

export const PageDescriptionWrapper = styled.div`
  margin-bottom: 26px;
  margin-top: 16px;
`;

export const PageDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: normal !important;

  span {
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
  }
`;

export const NewsWrapper = styled.div`
  display: flex;
  gap: 23px;
  flex-wrap: wrap;
`;

export const CommentsWrapper = styled.div`
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 768px) {
    max-height: 340px;
    overflow-y: auto;
  }
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
