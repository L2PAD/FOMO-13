import styled from "styled-components";
import Dropdown from "../common/Dropdown";

export const HeaderWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  flex-wrap: wrap;
`;

export const LeftWrapper = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;

  @media (max-width: 767px) {
    gap: 8px;
  }
`;

export const DropdownWrapper = styled(Dropdown)`
  border: none !important;
`;

export const ShowTopWrapper = styled.button`
  display: flex;
  gap: 6px;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-warning);
  padding: 10px 12px;
  background: none;
  border-radius: 8px;
  border: none;
  cursor: pointer;

  @media (max-width: 767px) {
    gap: 4px;

    svg {
      width: 16px;
    }
  }
`;

export const GridWrapper = styled.button`
  display: flex;
  gap: 6px;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);
  padding: 10px 12px;
  background: none;
  border-radius: 8px;
  border: none;
  cursor: pointer;

  @media (max-width: 767px) {
    gap: 4px;
    font-size: 13px;

    svg {
      width: 16px;
    }
  }
`;
