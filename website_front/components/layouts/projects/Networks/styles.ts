import styled from "styled-components";
import Typography from "../../../global/common/Typography";
import Input from "../../../global/common/Input";
import { SearchIcon } from "../../../global/Icons";
import Dropdown from "../../../global/common/Dropdown";
import DropdownWithSearch from "../../../global/common/DropdownWithSearch";

export const PageDescriptionWrapper = styled.div`
  margin-top: 16px;
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
`;

export const PageDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: normal !important;
  span {
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
  }
`;

export const SearchWrapper = styled.div`
  display: flex;
  gap: 50px;
  justify-content: space-between;

  @media (max-width: 768px) {
    gap: 20px;
  }

  @media (max-width: 600px) {
    gap: 10px;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 8px;
  }

  button {
    font-size: 18px;

    @media (max-width: 768px) {
      font-size: 16px;
    }

    @media (max-width: 480px) {
      font-size: 14px;
    }
  }
`;

export const SearchInput = styled(Input)`
  width: 100% !important;
  &.white-input input {
    background: white;
  }
  input {
    width: 100%;
    padding: 10px 12px 10px 36px;

    @media (max-width: 768px) {
      padding: 8px 10px 8px 32px;
    }

    &::placeholder {
      font-weight: var(--font-weight-regular);
      font-size: 16px;
      line-height: 19px;
      color: var(--color-text-muted);

      @media (max-width: 768px) {
        font-size: 15px;
        line-height: 18px;
      }

      @media (max-width: 480px) {
        font-size: 14px;
        line-height: 17px;
      }
    }
    transition: all 0.3s ease;

    &:hover {
      background: var(--input-hover);
    }
    &:focus {
      background: var(--input-active);
    }
  }
`;

export const SearchIconStyle = styled(SearchIcon)`
  position: absolute;
  left: 10px;
  top: 7px;

  &.asset-icon {
    top: 9px;
  }

  path {
    fill: var(--color-text-soft);
  }

  &.small-icon path {
    fill: var(--color-text-soft);
  }
`;

export const DropdownsWrapper = styled.div`
  display: flex;
  margin-top: 16px;
  gap: 13px;
`;

export const NumberOfProjectsDropdown = styled(Dropdown)`
  background: rgba(0, 192, 153, 0.1) !important;
  border-radius: 8px;
  border: none !important;
  max-width: 200px !important;
  height: 35px;
  padding: 10px !important;

  .label-wrapper,
  .label-wrapper span {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-primary);
    justify-content: space-between !important;
  }

  .dropdown-class-name {
    top: 35px !important;
  }
`;
export const NumberOfProjectsDropdownSearch = styled(DropdownWithSearch)`
  border: none !important;
  max-width: 200px !important;
  padding: 10px !important;
  margin-top: -10px !important;

  .dropdown-placeholder {
    background: rgba(0, 192, 153, 0.1) !important;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-primary);
    justify-content: space-between !important;
    height: 35px !important;
    max-width: 200px !important;
    gap: 10px;
  }

  .dropdown-classname {
    top: 50px !important;
  }
`;
