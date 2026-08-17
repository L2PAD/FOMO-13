import styled from "styled-components";

export const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 0;
`;

export const Container = styled.div`
  .modal-style {
    width: 100% !important;
    max-width: 480px;

    .internal-wrapper {
      padding: 40px;
    }

    .header-wrapper {
      margin-bottom: 40px;
    }
  }
`;

export const NFTImageWrapper = styled.div`
  width: 100%;
  max-width: 360px;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  margin: 0 auto;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const PriceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const PriceLabel = styled.div`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: 4px;
`;

export const PriceInputWrapper = styled.div<{ hasError?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  transition: border-color 0.2s;

  input {
    border: 1px solid ${(props) => (props.hasError ? "#ff4d4f" : "#e0e0e0")};
    border-radius: 8px;
  }

  &:focus-within {
    border-color: ${(props) => (props.hasError ? "#ff4d4f" : "var(--color-primary)")};
  }
`;

export const PriceInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  color: var(--color-text-primary);
  background: transparent;
  padding: 12px;

  &::placeholder {
    color: #b0b0b0;
  }
`;

export const CurrencySelectContainer = styled.div`
  position: relative;
`;

export const CurrencySelectButton = styled.button<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: #f5fbfd;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  min-width: 90px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    background: #e8f7f4;
  }

  ${({ isOpen }) =>
    isOpen &&
    `
    border-color: var(--color-primary);
    background: #e8f7f4;
  `}
`;

export const CurrencyArrow = styled.div<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
    color: var(--color-text-primary);
  }

  ${({ isOpen }) =>
    isOpen &&
    `
    transform: rotate(180deg);
  `}
`;

export const CurrencyDropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 10;
  min-width: 90px;
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
  transform: ${({ isOpen }) =>
    isOpen ? "translateY(0)" : "translateY(-10px)"};
  transition: all 0.2s ease;
`;

export const CurrencyOption = styled.button<{ isSelected: boolean }>`
  display: block;
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  background: ${({ isSelected }) => (isSelected ? "#f5fbfd" : "white")};
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: ${({ isSelected }) => (isSelected ? "600" : "500")};
  color: var(--color-text-primary);
  transition: all 0.15s ease;

  &:hover {
    background: #f5fbfd;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
`;

export const CurrencySelect = styled.select`
  border: none;
  outline: none;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  background: transparent;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f5fbfd;

  &:hover {
    background: #f5f5f5;
  }
`;

export const PriceUSD = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 4px;
`;

export const ErrorText = styled.div`
  font-size: 14px;
  color: #ff4d4f;
`;

export const DescriptionText = styled.div`
  font-size: 14px;
  line-height: 1.2;
  color: var(--color-text-primary);
  padding: 16px 0;
`;

export const HighlightText = styled.span`
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const ButtonsWrapper = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

export const CancelButton = styled.button`
  flex: 1;
  padding: 8px 24px;
  border-radius: 8px;
  background: #f9f9f9;
  font-size: 16px;
  font-weight: var(--font-weight-medium);
  color: var(--color-danger);
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;

  &:hover {
    background: #f5f5f5;
    border-color: #d0d0d0;
  }
`;

export const SubmitButton = styled.button`
  flex: 1;
  padding: 8px 24px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  font-size: 16px;
  font-weight: var(--font-weight-medium);
  color: var(--color-white);
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;

  &:hover {
    background: #038e73;
  }

  &:disabled {
    background: #b0b0b0;
    cursor: not-allowed;
  }
`;

export const SuccessContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0;
`;

export const SuccessMessage = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-muted);
  text-align: left;
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 20px 0;
  padding: 20px;
  background: #f5fbfd;
  border-radius: 12px;
  row-gap: 40px;
`;

export const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
`;

export const InfoLabel = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
`;

export const InfoValue = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);

  &.success {
    color: var(--color-primary);
  }
`;

export const DoneButton = styled.button`
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #038e73;
  }
`;

export const CancelOfferSection = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid #f0f2f5;
  margin-top: 8px;

  button {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    padding: 8px 16px;

    &:hover {
      color: var(--color-text-primary);
      background: #f5f5f5;
    }
  }
`;

export const CancelTitle = styled.h3`
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
`;

export const CancelDescription = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-primary);
`;

export const CancelWarning = styled.button`
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: #ff4d4f;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;

  &:hover {
    background: #fff1f0;
  }
`;

export const BackButton = styled.button`
  width: 100%;
  padding: 14px 24px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: var(--color-white);
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    border-color: #d0d0d0;
  }
`;
