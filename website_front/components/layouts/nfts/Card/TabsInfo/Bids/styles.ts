import styled from "styled-components";
import Dropdown from "../../../../../global/common/Dropdown";
import BaseCard from "../../../../../global/common/BaseCard";
import Typography from "../../../../../global/common/Typography";

export const Wrapper = styled(BaseCard)`
  width: 100% !important;
  padding: 0 !important;
`;

export const Header = styled.div`
  padding: 14px 15px;
  background: #f8f8f9;
`;

export const DropdownWrapper = styled(Dropdown)`
  border: none !important;
  background: #f8f8f9 !important;
  padding: 0 !important;

  .dropdown-class-name {
    top: 18px;
    background: #f8f8f9 !important;
    border-radius: 8px !important;
  }
`;

export const Row = styled.div`
  padding: 16px;
  &:not(:last-child) {
    border-bottom: 2px solid #f8f8f9;
  }
`;

export const RowValue = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 20px;
    color: var(--color-text-primary);
  }
  i {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;
