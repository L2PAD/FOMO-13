import styled from "styled-components";
import Typography from "../../../global/common/Typography";
import BaseCard from "../../../global/common/BaseCard";
import { Button } from "../../../global/common/Button";
import { SearchContainer as CryptoSearchContainer } from "../CryptoMarket/styles";
import { CryptoHeaderActions as BaseCryptoHeaderActions } from "../Crypto/styles";
import { mobileActionsRowStyles } from "../../../global/common/MobileActionsRow/styles";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 27px auto;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const ContentWrapper = styled.div`
  margin-top: 16px;
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

export const ChartsWrapper = styled.div`
  margin: 40px 0;

  @media (max-width: 768px) {
    margin: 30px 0;
  }

  @media (max-width: 480px) {
    margin: 20px 0;
  }

  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    margin-bottom: 20px;

    @media (max-width: 768px) {
      font-size: 22px;
      margin-bottom: 16px;
    }

    @media (max-width: 480px) {
      font-size: 20px;
      margin-bottom: 12px;
    }
  }
`;

export const Charts = styled.div`
  max-width: 100%;
  display: flex;
  gap: 20px;

  & > .unlocking-chart-cell {
    flex: 1 1 50%;
    width: 50%;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 16px;

    & > .unlocking-chart-cell {
      flex: 1 1 100%;
      width: 100%;
    }
  }

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

export const UnlockingContentModeActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
`;

export const UnlockingContentModeButton = styled.button<{ isActive: boolean }>`
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  min-width: 40px;
  padding: 8px;
  border-radius: 8px;
  background: ${({ isActive }) =>
    isActive ? "rgba(4, 165, 132, 0.12)" : "#f9f9f9"};
  color: ${({ isActive }) =>
    isActive ? "var(--color-primary)" : "var(--color-text-muted)"};
  transition: all 0.3s ease;
  white-space: nowrap;

  svg {
    flex-shrink: 0;
  }

  &:hover {
    background: ${({ isActive }) =>
      isActive ? "rgba(4, 165, 132, 0.18)" : "var(--input-hover)"};
  }

  &:active {
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    min-height: 36px;
    min-width: 36px;
    padding: 6px;
  }
`;

export const MobileTableActions = styled.div`
  margin: 16px 0;

  @media (min-width: 768px) {
    display: none;
  }
`;

export const MobileHeroContent = styled.div`
  @media (min-width: 768px) {
    display: none;
  }
`;

export const UnlockingMobileSearchContainer = styled(CryptoSearchContainer)`
  width: 100%;

  & > div,
  .inputRootWrapper,
  input {
    width: 100%;
    max-width: none;
  }
`;

export const UnlockingMobileHeaderActions = styled(BaseCryptoHeaderActions)`
  @media (max-width: 767px) {
    ${mobileActionsRowStyles}

    & > * {
      flex: 0 0 auto;
      margin-left: 0;
    }

    .unlocking-action-group {
      display: flex;
      margin-left: 0;
    }

    .unlocking-action-group > button {
      flex: 0 0 auto;
    }
  }
`;
