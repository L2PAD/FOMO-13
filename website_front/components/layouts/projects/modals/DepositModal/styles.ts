import styled, { keyframes } from "styled-components";

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

export const Info = styled.div`
  font-size: 14px;
  padding: 20px;
  background: #f5fbfd;
  border-radius: 8px;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Label = styled.label`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  color: var(--color-text-primary);
`;

export const ExchangeRate = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 4px;
`;

export const NetworkFee = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 4px;
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


`;

export const AmountLabel = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: center;
`;

export const WithdrawLink = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);

  button {
    color: var(--color-primary);
    cursor: pointer;
    font-weight: var(--font-weight-semibold);
    transition: opacity 0.3s ease;
    &:hover{
      opacity: 0.6;
    }
    &:active{
      opacity: 0.4;
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

export const Timer = styled.div`
  font-size: 24px;
  color: var(--color-text-muted);
  text-align: center;
  border-radius: 8px;
`;

export const QRCodeWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px;
`;

export const QRCodePlaceholder = styled.div`
  width: 160px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-white);
  padding: 0 10px;

  svg {
    width: 100%;
    height: 100%;
  }
`;

export const CredentialsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
`;

export const CredentialRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const CredentialLabel = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
`;

export const CredentialValue = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  display: flex;

  svg{
    width:20px;
    height:20px;
  }

  &:hover {
    opacity: 0.5;
  }
`;

export const InfoBox = styled.div`
  background: #fff9e6;
  border: 1px dashed #ffc107;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const InfoText = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
`;

export const SuccessWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
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

export const AstronautWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
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

export const ButtonsRow = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;

  button {
    flex: 1;
    padding: 16px;
    font-size: 16px;
    border-radius: 8px;
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


export const AmountInput = styled.input<{ $hasFocus?: boolean }>`
  font-weight: var(--font-weight-semibold);
  font-size: 48px;
  color: var(--color-text-primary);
  letter-spacing: -1px;
  max-width: 100%;
  text-align: center;
  background: transparent;
  border: none;
  position: relative;
  padding-right: 2px;
  
`;

export const PaymentMethod = styled.div`
  width: 100%;
  padding: 6px 8px;
  background: var(--color-white);
  border: 1px solid #E8E8E8;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;

  &:hover {
    border-color: #C4C4C4;
  }

  & .wallet-wrapper{
    display: flex;
    align-items: center;
    gap: 6px;
  }

  & .wallet{
    font-size: 16px;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  & .balance{
    display: flex;
    gap: 4px;
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

`

export const MinimizedBar = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--color-surface-muted);
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  min-width: 400px;

  @media (max-width: 600px) {
    min-width: auto;
    left: 12px;
    right: 12px;
    bottom: 12px;
    padding: 20px;
  }
`;

export const MinimizedContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  color: var(--color-text-primary);
`;

export const ExpandButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: all 0.2s ease;

  &:hover {
    color: var(--color-primary);
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
