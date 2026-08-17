import styled, { keyframes } from "styled-components";
import Typography from "../common/Typography";
import DropdownComponent from "../common/Dropdown";
import { mobileActionControlStyles } from "../common/MobileActionsRow/styles";

export const FilterWrapper = styled.div`
  position: relative;
  z-index: 5;

  & .sort-title {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--main-black);
    margin-top: 12px;
    margin-bottom: 6px;
  }
`;

export const FilterButton = styled.div<{ newSort?: boolean }>`
  position: relative;
  padding: 10px 12px;
  background: ${({ newSort }) =>
    newSort ? "#F9F9F9" : "rgba(0, 192, 153, 0.1)"};
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-medium);
  font-size: 16px;
  line-height: 19px;
  color: ${({ newSort }) =>
    newSort ? "var(--color-text-primary)" : "var(--color-primary)"};
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;

  transition: background 0.3s ease;

  &:hover {
    background: ${({ newSort }) =>
      newSort ? "var(--input-hover)" : "rgba(0, 192, 153, 0.2)"};
  }
  &:active {
    background: ${({ newSort }) =>
      newSort ? "var(--input-active)" : "rgba(0, 192, 153, 0.35)"};
  }

  p {
    font-size: 14px;
    font-weight: var(--font-weight-medium);
  }

  @media (max-width: 768px) {
    ${({ newSort }) => newSort && mobileActionControlStyles}

    svg {
      width: 14px;
    }

    &.arena {
      width: calc(50% - 6px);
    }
  }

  & .sort-trigger {
    display: flex;
    align-items: center;
    gap: 8px;

    p,
    span {
      font-weight: var(--font-weight-medium);
      white-space: nowrap;
    }
  }

  @media (max-width: 1120px) {
    & .sort-dropdown {
      min-width: 180px;
    }
  }
`;

export const SearchButton = styled.div`
  position: relative;
  max-width: 100px;
  transition: all 0.3s ease;

  &.active {
    max-width: 200px;
  }

  @media (max-width: 767px) {
    max-width: 100%;
    width: 100%;
  }

  & .search {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
  }

  input {
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    padding: 10px 12px;
    box-sizing: border-box;
    max-width: 100%;
    transition: all 0.3s ease;
    padding: 10px;
    padding-left: 36px;
    height: 39px;
    font-weight: var(--font-weight-medium);
    &:hover {
      background: var(--input-hover);
    }
    &:focus {
      background: var(--input-active);
    }
    &::placeholder {
      color: var(--main-black);
      font-family: Gilroy;
      font-size: 14px;
      font-style: normal;
      font-weight: var(--font-weight-medium);
    }
    &:disabled {
      opacity: 0.9;
      background: #e3e3e3 !important;
      cursor: not-allowed;
    }

    @media (max-width: 767px) {
      width: 100%;
    }
  }
  &.active {
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
  }
`;

export const DropdownWrapper = styled.div`
  padding: 20px 16px;
  background: white;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
`;

export const Dropdown = styled.div<{ active: boolean; right?: boolean }>`
  padding-top: 5px;
  width: 237px;
  position: absolute;
  z-index: 20;
  top: 40px;
  left: ${({ right }) => (right ? "-140px" : 0)};
  display: ${({ active }) => (active ? "block" : "none")};
`;

export const DropdownRow = styled.div`
  display: flex;
  flex-direction: column;
  grid-template-columns: 1fr 1fr;
  grid-gap: 10px;
  gap: 10px;
  &:not(:last-child) {
    padding-bottom: 25px;

    @media (max-width: 500px) {
      padding-bottom: 15px;
    }
  }
  .checkboxes {
    display: flex;
    flex-direction: column;
    grid-template-columns: 1fr 1fr;
    grid-gap: 10px;
    gap: 12px;
    &.grid {
      display: grid;
    }

    &.language {
      width: 100%;
      min-width: 100%;
      grid-template-columns: 1fr 1fr 1fr !important;

      @media (max-width: 500px) {
        grid-template-columns: 1fr !important;
      }
    }

    &.riskLevel {
      grid-template-columns: 1fr !important;
    }

    @media (max-width: 500px) {
      grid-template-columns: 1fr !important;
    }
  }
`;

export const RangeTitleWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const RangeTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-primary);
`;
export const DropdownCurrency = styled(DropdownComponent)`
  border: none !important;
  padding: 0 12px !important;
  p,
  span {
    font-weight: 400 !important;
    font-size: 14px !important;
    line-height: 16px !important;
    color: var(--color-text-primary) !important;
  }
  .dropdown-class-name {
    top: 15px;
  }
`;

export const InputRowWrapper = styled.input`
  padding: 11px 12px;
  background: #f8f8f9;
  border-radius: 8px;
  border: none;
`;

export const Overlay = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  z-index: 10;
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const SortDropdown = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: -60px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  min-width: 180px;
  max-height: ${({ isVisible }) => (isVisible ? "320px" : "0")};
  opacity: ${({ isVisible }) => (isVisible ? "1" : "0")};
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
  z-index: 1000;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top right;
  transform: ${({ isVisible }) => (isVisible ? "scale(1)" : "scale(0.95)")};

  &.settings-dropdown {
    padding: 12px;
    right: -200%;
  }

  &.duels-dropdown {
    min-width: 248px;
  }

  & .custom-dropdown-menu {
    max-height: 135px;
  }

  @media (max-width: 1120px) {
    min-width: unset;
    max-width: 100%;
  }

  @media (max-width: 480px) {
    right: unset;
    left: 0px;
    min-width: 100%;
    max-height: 400px;
  }
`;

export const SortOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &.resolved {
    padding-bottom: 12px;
  }

  &.my-predictions {
    padding: 12px;
    border-top: 1px solid #eef1f5;
  }

  &:hover {
    background: #f8f9fa;

    .option-name {
      color: var(--main-green);
    }
  }

  &.selected {
    background: #f0f7f4;

    .option-name {
      color: var(--main-green);
      font-weight: var(--font-weight-medium);
    }
  }

  .option-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
  }

  .option-name {
    font-size: 14px;
    color: #333;
    transition: color 0.2s ease;
  }
`;

export const SettingsWrapper = styled.div`
  position: relative;
`;
