import styled from "styled-components";
import BaseCard from "../common/BaseCard";

export const YourCommentWrapper = styled.div`
  margin-top: 16px;
  width: 100% !important;
  min-height: 324px;
  overflow-y: auto;
  background: #f5fbfd;
  padding: 20px;
  border-radius: 20px;

  @media (max-width: 991px) {
    min-height: 260px;
  }
  @media (max-width: 575px) {
    min-height: initial;
    padding: 14px;
    border-radius: 12px;
  }
`;

export const CommentsMainWrapper = styled.div`
  width: 100%;
  display: flex;
  gap: 16px;

  @media (max-width: 991px) {
    flex-direction: column;
  }

  @media (max-width: 575px) {
    gap: 12px;
  }
`;

export const CommentBlockWrapper = styled.div`
  width: 100%;
`;

export const TopicWrapper = styled.div`
  margin-top: 20px;
  margin-bottom: 10px;
  display: grid;
  grid-gap: 10px;

  p {
    color: var(--color-text-muted);
  }

  @media (max-width: 575px) {
    margin-top: 12px;
    margin-bottom: 6px;
    grid-gap: 8px;
  }
`;

export const YourCommentTextarea = styled.textarea`
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 9px 12px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-primary);
  width: 100%;
  height: 180px;
  resize: none;
  border: none;

  &::placeholder {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }

  transition: all 0.3s ease;

  @media (max-width: 575px) {
    height: 140px;
    font-size: 13px;
    &::placeholder {
      font-size: 13px;
    }
  }
`;

export const CommentActionsWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 24px;
  align-items: center;

  @media (max-width: 575px) {
    margin-top: 12px;
    gap: 12px;
  }
`;

export const PublishButton = styled.button`
  background: var(--color-primary);
  border-radius: 12px;
  padding: 13px;
  width: 100%;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-white);
  border: none;
  transition: all 0.3s ease;

  &:hover {
    background: var(--color-primary-hover);
  }
  &:active {
    background: #027e65;
  }
  &:disabled {
    cursor: not-allowed;
    background: #027e65;
  }

  @media (max-width: 575px) {
    font-size: 16px;
    line-height: 20px;
    padding: 11px;
    border-radius: 10px;
  }
`;

export const AddPhotoButton = styled.button`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-primary);
  border: none;
  background: none;
  padding: 13px 0;

  @media (max-width: 575px) {
    font-size: 14px;
    padding: 10px 0;
  }
`;

export const RemovePhotoButton = styled.button`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-danger);
  border: none;
  background: none;
  padding: 13px 0;
  display: flex;
  align-items: flex-start;
  gap: 6px;

  @media (max-width: 575px) {
    font-size: 14px;
    padding: 10px 0;
    gap: 4px;
  }
`;

export const CommentsWrapper = styled.div`
  margin-top: 16px;
  width: 100% !important;
  max-height: 340px;
  overflow-y: auto;
  background: #f5fbfd;
  padding: 20px;
  border-radius: 20px;

  @media (max-width: 575px) {
    padding: 14px;
    border-radius: 12px;
  }
`;

export const CommentsTitle = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 24px;
  margin-top: 40px;

  @media (max-width: 767px) {
    margin-top: 24px;
    font-size: 20px;
    line-height: 22px;
  }

  @media (max-width: 575px) {
    font-size: 18px;
    line-height: 20px;
  }
`;

export const ImageWrapper = styled.div`
  img {
    width: 50px;
  }
`;

export const TopicInputWrapper = styled.div`
  p {
    margin: 5px 0;
  }
  input {
    background: white;
  }
`;
