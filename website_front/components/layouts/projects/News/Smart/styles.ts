import styled from "styled-components";
import Typography from "../../../../global/common/Typography";
import Input from "../../../../global/common/Input";
import Dropdown from "../../../../global/common/Dropdown";
import BaseCard from "../../../../global/common/BaseCard";

export const PageDescriptionWrapper = styled.div`
  margin-bottom: 16px;
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

export const SearchInput = styled(Input)`
  width: 100% !important;

  input {
    width: 100%;
    padding: 8px 12px 8px 36px;
    &::placeholder {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 19px;
      color: rgba(115, 128, 148, 0.5);
    }
  }
`;

export const DropdownWrapper = styled(Dropdown)`
  border: none !important;
`;

export const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

export const YourCommentWrapper = styled(BaseCard)`
  margin-top: 16px;
  width: 100% !important;
`;

export const YourCommentTextarea = styled.textarea`
  background: #f8f8f9;
  border-radius: 8px;
  padding: 9px 12px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-primary);
  width: 100%;
  height: 80px;
  resize: none;
  border: none;

  &::placeholder {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }
`;

export const CommentActionsWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 24px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 16px;
    flex-wrap: wrap;
  }
`;

export const PublishButton = styled.button`
  background: var(--color-primary);
  border-radius: 8px;
  padding: 13px;
  width: 274px;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-white);
  border: none;

  @media (max-width: 768px) {
    width: 100%;
    font-size: 16px;
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
`;

export const CommentsWrapper = styled(BaseCard)`
  margin-top: 16px;
  width: 100% !important;
  max-height: 500px;
  overflow-y: auto;
`;
