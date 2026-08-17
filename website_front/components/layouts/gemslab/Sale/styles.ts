import styled from "styled-components";
import Typography from "../../../global/common/Typography";
import BaseCard from "../../../global/common/BaseCard";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 35px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

export const PreviewPanel = styled.div`
  width: 100%;
  padding: 16px;
  border: 1px solid rgba(83, 98, 124, 0.12);
  border-radius: 12px;
  background: #f8f8f9;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const PreviewPanelTitle = styled.p`
  margin: 0;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 20px;
  color: var(--color-text-primary);
`;

export const PreviewButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const PreviewButton = styled.button<{ active: boolean }>`
  border: 1px solid ${({ active }) => (active ? "var(--color-primary)" : "#d6dbe4")};
  border-radius: 999px;
  padding: 8px 14px;
  background: ${({ active }) => (active ? "var(--color-primary)" : "var(--color-white)")};
  color: ${({ active }) => (active ? "var(--color-white)" : "var(--color-text-primary)")};
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 16px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    color: ${({ active }) => (active ? "var(--color-white)" : "var(--color-primary)")};
  }
`;

export const Title = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 32px;
  line-height: 39px;
  color: var(--color-text-primary);
  margin: 12px 0 8px !important;
`;

export const Description = styled.p`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-muted);
`;

export const StagesWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  border-top: 2px solid #ecedf0;
  width: 100%;

  @media (max-width: 850px) {
    flex-direction: column;
    gap: 25px;
  }
`;

export const StageWrapper = styled.div<{ done: boolean }>`
  background: ${({ done }) =>
    done ? "rgba(248, 248, 249, 1)" : "rgba(248, 248, 249, .5)"};
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  margin-top: -2px;
  height: max-content;
  margin-left: 8px;

  p {
    color: ${({ done }) =>
      done ? "rgba(7, 11, 53, 1)" : "rgba(7, 11, 53, .5)"};
  }

  h6 {
    color: ${({ done }) =>
      done ? "rgba(115, 128, 148, 1)" : "rgba(115, 128, 148, .5)"};
  }

  span {
    color: ${({ done }) =>
      done ? "rgba(115, 128, 148, 1)" : "rgba(115, 128, 148, 0.5)"};
  }
`;

export const StageTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
`;

export const StageDates = styled(Typography)`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
`;

export const StagePoint = styled.span`
  border: 2px solid rgba(236, 237, 240, 0.5);
  border-radius: 100%;
  position: absolute;
  top: -18px;
  left: -18px;
  z-index: 2;
  background: white;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
`;

export const StageDoneWrapper = styled(BaseCard)`
  width: 288px !important;
  padding: 12px !important;
  margin-top: 16px;
  background: white;
`;

export const StageDoneTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-muted) !important;
`;

export const StageDoneAmountWrapper = styled.div`
  margin-top: 10px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const StageDoneAmount = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary) !important;

  span {
    font-size: 18px;
  }
`;

export const StageDoneDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted) !important;
`;

export const StageDoneButton = styled.button<{ full: boolean }>`
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  padding: 8px 12px;
  background: white;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-primary);
  margin-top: 6px;
  width: ${({ full }) => (full ? "100%" : "max-content")};
  transition: all 0.3s ease;

  &:hover {
    background: var(--color-primary);
    color: white;
  }
  &:active {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.7;
    background: white;
    color: var(--color-primary);
    cursor: not-allowed;
  }
`;

export const StageDoneTimer = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-primary);
  margin-bottom: 16px;
`;

export const StageDoneLastText = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-muted) !important;

  &:first-child {
    margin-bottom: 10px !important;
  }
  &:last-child {
    margin-bottom: 6px !important;
  }
`;

export const ActionButton = styled.button`
  margin-top: 24px;
  background: var(--color-primary);
  border-radius: 8px;
  padding: 13px;
  width: 100%;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-white);
  border: none;
`;

export const ActionsContentWrapper = styled.div`
  margin-top: 4px;
  background: #f8f8f9;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

export const ActionsContentTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
`;

export const ClaimDoneWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 32px;

  button {
    border: none;
    background: none;
    width: 100%;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-primary);
  }
`;

export const ClaimDoneDataWrapper = styled.div`
  background: #f8f8f9;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  min-width: 307px;

  @media (max-width: 365px) {
    min-width: 250px;
  }

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29px;
  }

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);
    margin-bottom: 6px;
  }
`;

export const PurchaseInputWrapper = styled.div`
  input {
    width: 100%;
    border: none;
    background: white;
    border-radius: 8px;
    padding: 12px 16px;
  }
`;
export const StakeValue = styled.div`
  margin-top: 4px;
  font-size: 14px;
  color: rgba(115, 128, 148, 1);
  & span {
    color: black;
    font-weight: var(--font-weight-semibold);
  }
`;

export const ClaimInfo = styled.div`
  color: #01b101;
  font-weight: var(--font-weight-medium);
`;
