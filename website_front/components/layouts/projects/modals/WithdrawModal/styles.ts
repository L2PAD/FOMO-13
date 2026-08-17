import styled from "styled-components";

export const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  margin-top: 20px;
  gap: 0;
`;

export const Step = styled.div<{ active: boolean; completed: boolean }>`
  display: flex;
  align-items: center;
`;

export const StepCircle = styled.div<{ active: boolean; completed: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  color: ${({ active, completed }) =>
    completed || active ? "var(--color-primary)" : "#EEF9F6"};
  border: 2px solid
    ${({ active, completed }) => (completed || active ? "var(--color-primary)" : "#EEF9F6")};
  transition: all 0.3s ease;
`;

export const StepLine = styled.div<{ active: boolean }>`
  width: 140px;
  margin: 0 12px;
  height: 2px;
  background: ${({ active }) => (active ? "var(--color-primary)" : "#EEF9F6")};
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: 80px;
  }
`;

export const StepContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
`;

export const Label = styled.label`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  color: var(--color-text-primary);
`;

export const Input = styled.input<{ error?: boolean }>`
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--color-white);
  border: 1px solid ${({ error }) => (error ? "var(--color-danger)" : "#E8E8E8")};
  font-family: inherit;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;

  &::placeholder {
    color: rgba(115, 128, 148, 0.5);
    font-size: 14px;
  }

  &:focus {
    outline: none;
    border-color: ${({ error }) => (error ? "var(--color-danger)" : "var(--color-primary)")};
  }
`;

export const AvailableBalance = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 4px;
  position: absolute;
  right: 38px;
  top: 33px;

  span {
    color: #000;
  }
`;

export const HintText = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 4px;
`;

export const ErrorText = styled.div`
  font-size: 12px;
  color: var(--color-danger);
  margin-top: 4px;
`;
export const AmountInput = styled.input<{ $hasFocus?: boolean }>`
  font-weight: var(--font-weight-semibold);
  font-size: 48px;
  color: var(--color-text-primary);
  letter-spacing: -1px;
  width: fit-content;
  max-width: 100%;
  text-align: center;
  background: transparent;
  border: none;
  position: relative;
  padding-right: 2px;
`;

export const AmountInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: #f8f8f9;
  border: 2px solid var(--color-primary);
  border-radius: 12px;
  gap: 12px;
  margin-top: 10px;
`;


export const AmountValue = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 48px;
  color: var(--color-text-primary);
  letter-spacing: -1px;

  &::after {
    content: "|";
    color: var(--color-primary);
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%,
    50% {
      opacity: 1;
    }
    51%,
    100% {
      opacity: 0;
    }
  }
`;

export const ButtonWrapper = styled.div`
  margin-top: 10px;

  button {
    width: 100%;
    padding: 16px;
    font-size: 16px;
    border-radius: 8px;
  }
`;

export const DetailsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #f5fbfd;
  border-radius: 12px;
  margin-top: 10px;
`;

export const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const DetailLabel = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
`;

export const DetailValue = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const WarningBox = styled.div`
  background: #fff9e6;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const WarningText = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
`;

export const InfoBox = styled.div`
  background: var(--color-surface-muted);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const InfoText = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
`;

export const Timer = styled.div`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  text-align: center;
`;

export const AstronautWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
`;

export const ClockIllustration = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StatusTitle = styled.h3`
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  text-align: left;
  margin: 0;
`;

export const StatusDescription = styled.p`
  font-size: 14px;
  text-align: left;
  line-height: 1.6;
  margin: 0;
`;

export const CancelButton = styled.button`
  width: 100%;
  padding: 16px;
  font-size: 16px;
  border-radius: 8px;
  background: none;
  color: var(--color-danger);
  border: none;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #fff5f5;
  }

  &:active {
    background: #ffe8e8;
  }
`;

export const SuccessWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
`;

export const SuccessIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: var(--color-primary-soft);
  border-radius: 50%;
`;

export const SuccessTitle = styled.h2`
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin: 0;
`;

export const AstronautImage = styled.div`
  font-size: 120px;
`;

export const SuccessMessage = styled.div`
  font-size: 16px;
  color: var(--color-text-primary);
  text-align: center;

  strong {
    font-weight: var(--font-weight-semibold);
  }
`;

export const SuccessDescription = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.6;
  margin: 0;
`;

export const ButtonsRow = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;

  button {
    flex: 1;
    padding: 8px 16px;
    font-size: 16px;
    border-radius: 8px;
  }
`;

export const CloseTextButton = styled.button`
  flex: 1;
  padding: 16px;
  font-size: 16px;
  border-radius: 8px;
  background: none;
  color: var(--color-danger);
  border: none;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.3s ease;
  max-width: 100px;

  &:hover {
    background: #fff5f5;
  }

  &:active {
    background: #ffe8e8;
  }
`;

export const CloseButton = styled.button`
  flex: 1;
  padding: 16px;
  font-size: 16px;
  border-radius: 8px;
  background: #f9f9f9;
  color: var(--color-danger);
  border: none;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #f0f0f0;
  }

  &:active {
    background: #e8e8e8;
  }
`;

export const ErrorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
`;

export const ErrorIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: rgba(255, 88, 88, 0.1);
  border-radius: 50%;
`;

export const ErrorTitle = styled.h2`
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-danger);
  margin: 0;
`;

export const ConfusedAstronaut = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ErrorMessage = styled.div`
  font-size: 16px;
  color: var(--color-text-primary);
  text-align: center;
  line-height: 1.6;
`;

export const ErrorReason = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: center;

  strong {
    font-weight: var(--font-weight-semibold);
  }
`;

export const NewRequestButton = styled.button`
  flex: 1;
  padding: 16px;
  font-size: 16px;
  border-radius: 8px;
  background: none;
  color: var(--color-primary);
  border: none;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(4, 165, 132, 0.05);
  }

  &:active {
    background: var(--color-primary-soft);
  }
`;

export const MinimizedBar = styled.div<{
  status: "pending" | "confirmed" | "rejected" | "cancelled";
}>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: ${({ status }) => {
    switch (status) {
      case "pending":
        return "var(--color-surface-muted)";
      case "rejected":
        return "#FFF5F5";
      case "cancelled":
        return "var(--color-danger)";
      case "confirmed":
        return "#F0FDF9";
      default:
        return "var(--color-surface-muted)";
    }
  }};
  border: 1px solid
    ${({ status }) => {
    switch (status) {
      case "pending":
        return "#E8E8E8";
      case "rejected":
        return "#FFE8E8";
      case "cancelled":
        return "var(--color-danger)";
      case "confirmed":
        return "#D1FAE5";
      default:
        return "#E8E8E8";
    }
  }};
  border-radius: 12px;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  min-width: 400px;
`;

export const MinimizedContent = styled.div<{
  status?: "pending" | "confirmed" | "rejected" | "cancelled";
}>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  color: ${({ status }) => (status === "cancelled" ? "var(--color-white)" : "var(--color-text-primary)")};

  svg {
    color: ${({ status }) =>
    status === "cancelled" ? "var(--color-white)" : "currentColor"};
  }
`;

export const ExpandButton = styled.button<{
  status?: "pending" | "confirmed" | "rejected" | "cancelled";
}>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ status }) => (status === "cancelled" ? "var(--color-white)" : "var(--color-text-muted)")};
  transition: all 0.2s ease;

  &:hover {
    color: ${({ status }) =>
    status === "cancelled" ? "rgba(255, 255, 255, 0.8)" : "var(--color-primary)"};
    transform: scale(1.1);
  }
`;

export const MinimizeButton = styled.button`
  position: absolute;
  top: 30px;
  right: 30px;
  background: var(--color-white);
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    color: var(--color-primary);
    transform: scale(1.1);
  }
`;

export const TransactionDetailsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: #f5fbfd;
  border-radius: 12px;
`;

export const CopyIcon = styled.button`
  margin-left: 8px;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  border: none;

  &:hover {
    opacity: 1;
  }
`;

export const ExplorerLink = styled.a`
  color: var(--color-primary);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  text-align: center;
  cursor: pointer;
  margin-top: 8px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    text-decoration: underline;
    opacity: 0.8;
  }
`;
