import styled from "styled-components";
// eslint-disable-next-line import/no-named-as-default
import Button from "../../common/Button";

export const ProgressWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const ProgressNumber = styled.div<{
  defaultValue: number;
  value: number;
}>`
  width: 40px;
  height: 40px;
  border: 2px solid
    ${({ value, defaultValue }) =>
      value >= defaultValue ? "var(--color-primary)" : "#EEF9F6"};
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 21px;
  color: ${({ value, defaultValue }) =>
    value >= defaultValue ? "var(--color-primary)" : "#EEF9F6"};
  position: relative;

  &:not(:last-child)::after {
    position: absolute;
    left: 50px;
    content: " ";
    background: ${({ value, defaultValue }) =>
      value > defaultValue ? "var(--color-primary)" : "#EEF9F6"};
    border-radius: 8px;
    height: 2px;
    width: 610px;
  }
`;

export const NextStepButton = styled(Button)`
  width: 100%;
  margin-top: 46px;
`;

export const PreviousStepButton = styled.button`
  width: 100%;
  margin-top: 24px;
  border: none;
  background: none;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-primary);
`;

export const ModalRow = styled.div`
  margin-top: 20px;

  & .text-label {
    margin-top: 12px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-gray);
  }

  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 17px;
    color: var(--main-black);
    margin-bottom: 12px;
  }

  textarea {
    background: #f9f9f9;
    padding: 12px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    width: 100%;
    max-width: 100%;
    min-width: 100%;
    min-height: 75px;
    transition: background 0.3s ease;

    &::placeholder {
      color: var(--color-text-soft);
    }

    &:hover {
      background: var(--input-hover);
    }
    &:focus {
      background: var(--input-active);
    }
    &::placeholder {
      color: rgba(115, 128, 148, 0.5);
      font-weight: var(--font-weight-medium);
      font-size: 14px;
      line-height: 16px;
    }
    &:disabled {
      opacity: 0.9;
      background: #e3e3e3;
      cursor: not-allowed;
    }
  }
`;

export const StatusWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
  }
`;

export const LogoWrapper = styled.div`
  margin-top: 20px;

  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }

  & > div {
    display: flex;
    gap: 12px;
  }

  button {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-primary);
    border: none;
    background: none;
  }
`;

export const LogoFakeImage = styled.div`
  width: 88px;
  height: 88px;
  border-radius: 8px;
  background: #f8f8f9;
`;

export const LogoImage = styled.img`
  min-width: 88px;
  min-height: 88px;
  max-width: 88px;
  max-height: 88px;
  border-radius: 8px;
  object-fit: contain;
`;

export const LogoInputLabel = styled.label`
  cursor: pointer;
  font-family: Gilroy, "sans-serif";
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-primary);
`;

export const FundingWrapper = styled.div`
  margin-top: 20px;

  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
`;

export const InvestorsHeader = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  button {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: #05c9a1;
    border: none;
    background: none;
  }

  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
`;

export const LogoInput = styled.input`
  opacity: 0;
  position: absolute;
  left: 0;
  top: 0;
  width: 88px;
  height: 88px;
  cursor: pointer;
`;
