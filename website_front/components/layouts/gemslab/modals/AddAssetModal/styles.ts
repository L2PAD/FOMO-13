import styled from "styled-components";
import DropdownWithSearch from "../../../../global/common/DropdownWithSearch";

export const DropdownWrapper = styled.div`
  margin-top: 24px;
`;
export const Dropdown = styled(DropdownWithSearch)`
  width: 100% !important;
  .dropdown-styles {
    top: 40px !important;
  }
  p {
    font-size: 14px !important;
  }
`;

export const Title = styled.span`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  margin-bottom: 7px !important;
`;

export const ListWrapper = styled.div`
  margin-top: 24px;
`;

export const List = styled.ul`
  margin-top: 16px;
  background: #f8f8f9;
  border-radius: 8px;
  overflow-y: auto;
  max-height: 328px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
`;

export const ListItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;

  button {
    border: none;
    background: none;
    display: none;
  }

  &:hover button {
    display: block;
  }
`;

export const UserRowItem = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);

  span {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-regular);
  }
`;

export const OrText = styled.div`
  margin: 24px 0;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  text-align: center;
`;

export const AddButton = styled.button`
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  width: 100%;
  padding: 13px;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-primary);
  background: none;
  margin-bottom: 24px;
`;

export const DescriptionBottom = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  color: var(--color-text-muted);
  width: 220px;
  margin: 0 auto 8px;
`;
