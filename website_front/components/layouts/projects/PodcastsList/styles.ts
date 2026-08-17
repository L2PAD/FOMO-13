import styled from "styled-components";
import Typography from "../../../global/common/Typography";
import Input from "../../../global/common/Input";
import Dropdown from "../../../global/common/Dropdown";
import BaseCard from "../../../global/common/BaseCard";

export const PageDescriptionWrapper = styled.div`
  margin-bottom: 16px;
  margin-top: 16px;
`;

export const SubTabsWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;

  & > div {
    display: flex;
    gap: 12px;
  }

  @media (max-width: 500px) {
    flex-wrap: wrap;
  }
`;

export const SubTabsFavWrapper = styled.div`
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: flex-end;
  width: max-content;

  @media (max-width: 500px) {
    flex-wrap: wrap;
  }
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
  font-size: 16px;
  line-height: 19px;
  color: var(--color-primary);
  border: none;
  background: none;
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

export const PodcastWrapper = styled(BaseCard)`
  width: 100%;
  padding: 0 !important;
  min-width: 228px !important;
  margin: 5px;

  img {
    width: 100%;
    height: 225px;
  }

  & > a {
    font-weight: var(--font-weight-semibold);
    font-size: 20px;
    line-height: 24px;
    color: var(--color-text-primary);
    display: block;
    text-align: center;
  }
`;
