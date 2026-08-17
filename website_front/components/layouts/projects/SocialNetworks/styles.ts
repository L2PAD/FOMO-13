import styled from "styled-components";
import Typography from "../../../global/common/Typography";
import Input from "../../../global/common/Input";
import { SearchIcon } from "../../../global/Icons";

export const PageDescriptionWrapper = styled.div`
  margin-top: 16px;
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
  margin-top: 24px;
`;

export const SearchInput = styled(Input)`
  width: 100% !important;

  input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    &::placeholder {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 19px;
      color: rgba(115, 128, 148, 0.5);
    }
  }
`;

export const SearchIconStyle = styled(SearchIcon)`
  position: absolute;
  left: 10px;
  top: 7px;
`;

export const SocialsWrapper = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
`;

export const SocialButton = styled.button<{ active: boolean }>`
  padding: 8px 10px;
  border: none;
  background: ${({ active }) =>
    active ? "rgba(0, 192, 153, 0.1)" : "rgba(115, 128, 148, 0.05)"};
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;

  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: ${({ active }) => (active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)")};

  svg {
    path {
      fill: ${({ active }) =>
        active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)"};
    }
  }
`;

export const TableWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;

  & > div {
    width: 100%;
  }
`;

export const ShowMoreButton = styled.button`
  padding: 0;
  border: none;
  background: none;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-primary);
`;
