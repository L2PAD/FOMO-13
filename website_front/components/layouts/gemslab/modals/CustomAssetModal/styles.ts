import styled from "styled-components";
import Typography from "../../../../global/common/Typography";
import Input from "../../../../global/common/Input";
import Dropdown from "../../../../global/common/Dropdown";

export const ContentWrapper = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Title = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  margin-bottom: 7px !important;
`;

export const BuySellWrapper = styled.div`
  padding: 4px;
  background: #f8f8f9;
  border-radius: 8px;
  font-weight: var(--font-weight-medium);
  font-size: 14px;
  line-height: 16px;
  display: flex;
  gap: 4px;
  width: max-content;
`;

export const BuySellItem = styled.div<{ active: boolean }>`
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 8px;

  background: ${({ active }) => (active ? "white" : "")};
  color: ${({ active }) => (active ? "var(--color-text-primary)" : "rgba(115, 128, 148, 0.5)")};
`;

export const InputStyle = styled(Input)`
  width: 100% !important;

  input {
    width: 100% !important;
  }
`;

export const MarketPriceInputs = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
`;

export const DropdownCurrency = styled(Dropdown)`
  padding: 0 !important;
  border: none !important;

  .dropdown-class-name {
    top: 17px !important;
    padding: 0 !important;
  }
`;

export const DateInputsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const DateInput = styled(Input)`
  &:first-child {
    width: 111px !important;
    input {
      width: 111px !important;
    }
  }

  &:last-child {
    width: 70px !important;
    input {
      width: 70px !important;
    }
  }
`;

export const SubmitButton = styled.button`
  padding: 13px;
  width: 100%;
  background: var(--color-primary);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-white);
`;
