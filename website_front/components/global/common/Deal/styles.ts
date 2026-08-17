import styled from "styled-components";
import Typography from "../Typography";

export const CommentWrapper = styled.div`
  padding: 16px 16px 0;
`;

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
`;

export const DateText = styled(Typography)`
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

export const DealName = styled.div`
  margin-top: 13px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);

  span {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;
