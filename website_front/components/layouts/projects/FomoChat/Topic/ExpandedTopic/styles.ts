import styled from "styled-components";

export const ExpandedTopicWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const TopicHeader = styled.div`
  display: flex;
  gap: 12px;
`;

export const AuthorAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

export const TopicHeaderInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const AuthorName = styled.div`
  .name {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: #1a1d26;
  }

  .handle {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: var(--color-primary);
  }

  .timestamp {
    font-size: 14px;
    color: #728094;
  }
`;

export const TopicTitle = styled.h1`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
  line-height: 1.4;
`;

export const TopicBody = styled.div`
  font-size: 16px;
  font-weight: var(--font-weight-regular);
  line-height: 1.6;
  color: #1a1d26;
  margin-bottom: 16px;

  p {
    margin: 12px 0;
  }

  ul {
    margin: 12px 0;
    padding-left: 24px;

    li {
      margin: 8px 0;
    }
  }

  strong {
    font-weight: var(--font-weight-semibold);
  }
`;

export const TopicTags = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;

  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
  }
`;

export const Tag = styled.span`
  background: #e0f7f4;
  color: #00a991;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  padding: 6px 12px;
  border-radius: 6px;
`;

export const TopicActions = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 20px 0;
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap;

  row-gap: 12px;
`;

export const ActionButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: ${(props) => (props.active ? "var(--color-primary)" : "#728094")};
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--color-primary);
  }

  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    order: 1;
  }
`;

export const CommentsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .dropdown {
    width: 300px;

    & > div {
      max-width: 177px !important;
    }
  }
`;

export const SortHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  width: fit-content;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  gap: 8px;

  .sort-label {
    font-size: 14px;
    color: #728094;
  }

  .sort-select {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    color: #1a1d26;
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    cursor: pointer;
  }
`;

export const CommentItem = styled.div`
  display: flex;
  gap: 12px;
  background: var(--color-white);
`;

export const CommentAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

export const CommentContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .name {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: #1a1d26;
  }

  .timestamp {
    font-size: 13px;
    color: #728094;
  }
`;

export const CommentText = styled.p`
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 1.6;
  color: #1a1d26;
  margin: 0;
`;

export const CommentActions = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 4px;
`;

export const CommentActionButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: ${(props) => (props.active ? "var(--color-primary)" : "#728094")};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--color-primary);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const HideRepliesButton = styled.button`
  background: transparent;
  border: none;
  color: #728094;
  font-size: 13px;
  cursor: pointer;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: var(--color-primary);
  }
`;

export const JoinDiscussionInput = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 12px;
  background: var(--color-white);
  border-radius: 8px;
  border: 1px solid #e8e8e8;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    resize: none;
    min-height: 10px;
    font-family: inherit;

    &::placeholder {
      color: #a0a0a0;
    }
  }
`;
