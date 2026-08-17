import styled from "styled-components";
import Input from "../../../../global/common/Input";
import { SearchIcon } from "../../../../global/Icons";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 27px auto;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const PageDescription = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);

  p {
    white-space: normal !important;
  }

  span {
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
  }
`;

export const SearchWrapper = styled.div`
  margin-top: 32px;
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
  path {
    fill: rgba(115, 128, 148, 0.5);
  }
`;

export const ContentWrapper = styled.div`
  margin-top: 24px;
`;

export const ActionsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const TableWrapper = styled.div`
  margin-top: 28px;
`;

export const ButtonsWrapper = styled.div`
  display: flex;
  gap: 24px;
`;

export const AddButton = styled.button`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-primary);
  border: none;
  background: none;
`;

export const DeleteButton = styled.button`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-danger);
  border: none;
  background: none;
`;
