import styled from "styled-components";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(7, 11, 53, 0.4);
  z-index: 1000;
`;

export const ModalWrapper = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  width: 100%;
  max-width: 760px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 40px;

  @media (max-width: 800px) {
    max-width: calc(100vw - 32px);
    padding: 24px;
    gap: 24px;
  }

  @media (max-width: 480px) {
    top: 0;
    left: 0;
    transform: none;
    height: 100%;
    padding: 20px 16px;
    gap: 20px;
    margin: 16px;
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

export const ModalTitle = styled.h2`
  font-family: "Gilroy", sans-serif;
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 30px;
  color: var(--color-text-primary);
  margin: 0;
`;

export const CloseButton = styled.button`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--color-text-muted);
  flex-shrink: 0;

  &:hover {
    color: var(--color-text-primary);
  }
`;

export const SectionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const FilterSection = styled.div`
  background: #f5fbfd;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 480px) {
    padding: 14px 12px;
  }
`;

export const SectionTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-text-primary);
  margin: 0;
`;

export const OptionsGrid = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 12px;
  }
`;

export const OptionsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;

  @media (max-width: 480px) {
    flex: 0 0 calc(50% - 6px);
  }
`;

export const CheckboxItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
`;

export const CheckboxInput = styled.input`
  display: none;
`;

export const CheckboxBox = styled.span<{ checked: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
  background: ${({ checked }) => (checked ? "var(--color-primary)" : "var(--color-white)")};
  border: ${({ checked }) => (checked ? "none" : "1px solid var(--color-text-soft)")};
  transition:
    background 0.15s,
    border 0.15s;
`;

export const CheckboxLabel = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  line-height: normal;
  color: var(--color-text-primary);
  white-space: nowrap;
`;

export const ModalFooter = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  @media (max-width: 480px) {
    margin-top: auto;
  }
`;

export const FooterButtons = styled.div`
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
`;

export const CancelButton = styled.button`
  width: 50%;
  max-width: 100%;
  padding: 14px;
  border-radius: 8px;
  border: none;
  background: #f8f8f9;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-danger);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--input-hover);
  }

  &:active {
    background: var(--input-active);
  }
`;

export const ApplyButton = styled.button`
  width: 50%;
  max-width: 100%;
  padding: 14px;
  border-radius: 8px;
  border: none;
  background: var(--color-primary);
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #39816a;
  }

  &:active {
    background: #2e6a58;
  }
`;

export const ResetButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: none;
  border: none;
  font-family: "Gilroy", sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
  cursor: pointer;
  margin: 20px auto 0;
  padding: 0;

  &:hover {
    opacity: 0.8;
  }
`;
