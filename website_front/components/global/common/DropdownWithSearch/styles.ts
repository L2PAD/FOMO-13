import styled from "styled-components";
import Typography from "../Typography";
import { ArrowDownIcon, SearchIcon } from "../../Icons";
import Input from "../Input";

export const Wrapper = styled.div`
  max-width: 205px;
  position: relative;
`;

export const Title = styled(Typography)`
  margin-bottom: 7px !important;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-primary);
`;

export const PlaceholderWrapper = styled.div<{ withValues: boolean }>`
  cursor: pointer;
  padding: 10px 12px;
  background: #f8f8f9;
  border-radius: 8px;
  color: ${({ withValues }) =>
    withValues ? "var(--color-text-primary)" : "rgba(115, 128, 148, 0.5)"};
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
export const Arrow = styled(ArrowDownIcon)<{ active: boolean }>`
  transform: ${({ active }) => `rotate(${active ? 180 : 0}deg)`};
  transition: 0.3s;
`;

export const DropdownWrapper = styled.div`
  position: absolute;
  background: white;
  top: 60px;
  width: 100%;
  padding-top: 5px;
  box-sizing: border-box;
  z-index: 22;
`;

export const Dropdown = styled.div`
  background: white;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid rgba(83, 98, 124, 0.07);
`;

export const InputStyle = styled(Input)`
  width: 100% !important;
  input {
    border: 1px solid #f3f4f6;
    background: white;
    font-size: 12px;
    font-weight: var(--font-weight-regular);
    line-height: 14px;
    color: var(--color-text-primary);
    &::placeholder {
      color: rgba(115, 128, 148, 0.5);
    }
  }
`;

export const OptionItem = styled.div<{ active: boolean }>`
  font-weight: ${({ active }: { active: boolean }) => (active ? 600 : 400)};
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-primary);
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 10px;
  cursor: pointer;
`;

export const SearchIconStyle = styled(SearchIcon)`
  position: absolute;
  left: 10px;
  top: 7px;
`;
