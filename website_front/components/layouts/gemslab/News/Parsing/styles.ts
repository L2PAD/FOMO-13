import styled from "styled-components";
import Typography from "../../../../global/common/Typography";
import Input from "../../../../global/common/Input";
import Dropdown from "../../../../global/common/Dropdown";

export const PageDescriptionWrapper = styled.div`
  margin-bottom: 16px;
  margin-top: 16px;
`;

export const SubTabsWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 12px;
`;

export const SubTabsFavWrapper = styled.div`
  display: flex;
  gap: 18px;
  align-items: center;
`;

export const SubTabsAction = styled.button<{ active: boolean }>`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  border-radius: 8px;
  padding: 8px 10px;
  border: none;

  color: ${({ active }) => (active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)")};
  background: ${({ active }) =>
    active ? "rgba(0, 192, 153, 0.1)" : "rgba(115, 128, 148, 0.05)"};
`;

export const AddFavAction = styled.button`
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 19px;
  color: var(--color-primary);
  border: none;
  background: none;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--color-primary);
  padding: 8px 16px;
  border-radius: 4px;
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

export const SearchInput = styled(Input)`
  width: 100% !important;

  input {
    width: 100%;
    padding: 8px 12px 8px 36px;
    &::placeholder {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 19px;
      color: rgba(115, 128, 148, 0.5);
    }
  }
`;

export const DropdownWrapper = styled(Dropdown)`
  border: none !important;
`;

export const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
`;
