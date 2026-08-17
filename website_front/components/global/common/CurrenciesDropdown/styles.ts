import styled from "styled-components";
import Typography from "../Typography";
import { ArrowDownIcon, SearchIcon } from "../../Icons";
import Input from "../Input";

export const Wrapper = styled.div`
  position: relative;
  &.marginTop {
    margin-top: 20px;
  }
`;

export const Title = styled(Typography)`
  margin-bottom: 12px !important;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-primary);
`;

export const PlaceholderWrapper = styled.input<{ withValues: boolean }>`
  cursor: pointer;
  padding: 10px 12px;
  background: #f8f8f9;
  border-radius: 8px;
  color: var(--color-text-soft);
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
export const Arrow = styled(ArrowDownIcon) <{ active: boolean }>`
  transform: ${({ active }) => `rotate(${active ? 180 : 0}deg)`};
  transition: 0.3s;
`;

export const DropdownWrapper = styled.div`
  position: absolute;
  background: white;
  top: 64px;
  max-width: 185px;
  padding-top: 5px;
  box-sizing: border-box;
  z-index: 22;
`;

export const Dropdown = styled.div`
  width: 100%;
  max-width: 225px;
  padding: 8px 12px;
  box-sizing: border-box;
  border-radius: 4px;
  box-shadow: 2px 2px 8px 2px #00053014;
  background: #f9f9f9;
  max-height: 220px;
  overflow: auto;
`;

export const InputStyle = styled(Input)`
  width: 100%;
  input {
    width: 100% !important;
    background: #f8f8f9;
    border-radius: 8px;
    border: none;
    padding: 8px 12px 8px 38px;
    width: 100%;
    transition: background 0.3s ease;

    &.left-icon {
      padding-left: 32px;
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

export const OptionItem = styled.div<{ active: boolean }>`
  font-weight: ${({ active }: { active: boolean }) => (active ? 600 : 400)};
  font-size: 14px;
  line-height: 24px;
  color: var(--color-text-primary);
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 12px;

  & .name {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
  }

  & .platform {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-gray);
  }
`;

export const SearchIconStyle = styled(SearchIcon)`
  position: absolute;
  left: 10px;
  top: 7px;
`;

export const SelectedItemsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  & .currency-item {
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    line-height: 100%;
    padding: 4px 8px;
    background: #f5fbfd;
    display: flex;
    align-items: center;
    gap: 6px;

    & .remove-btn {
      width: 12px;
      height: 12px;

      svg {
        width: 12px;
        height: 12px;
      }
    }
  }
`;
