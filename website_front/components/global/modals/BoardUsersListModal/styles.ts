import styled from "styled-components";
import Modal from "../../common/Modal";

export const ModalWrapper = styled(Modal)`
  & > div:last-child {
    width: 464px !important;
    position: relative;
  }

  @media (max-width: 470px) {
    & > div:last-child {
      width: 100% !important;
    }
  }
`;

export const HeaderWrapper = styled.div`
  position: absolute;
  top: 26px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 10px;

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29px;
  }
  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
  }
`;

export const DeltaWrapper = styled.div<{ amount: number }>`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: ${({ amount }) => (amount > 0 ? "var(--color-primary)" : "var(--color-danger)")};

  svg {
    transform: rotate(${({ amount }) => (amount > 0 ? "180deg" : "0")});
    width: 11px;
    height: 11px;
    path {
      fill: ${({ amount }) => (amount > 0 ? "var(--color-primary)" : "var(--color-danger)")};
    }
  }
`;

export const UsersWrapper = styled.div`
  height: 320px;
  overflow-y: auto;
  margin-top: 16px;

  &::-webkit-scrollbar {
  }

  &::-webkit-scrollbar-thumb {
  }

  &::-webkit-scrollbar-track {
  }

  &::-webkit-scrollbar-thumb:hover {
  }
`;

export const UserRow = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 13px;
  cursor: pointer;
  padding: 6px 12px 6px;
  transition: all 0.3s ease;
  border-radius: 4px;

  p {
    text-align: left;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
  }
  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }

  &:hover {
    background: var(--input-hover);
  }

  &:active {
    background: var(--input-active);
  }
`;

export const UserDataWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const ButtonWrapper = styled.div`
  margin-top: 14px;
  button {
    width: 100%;
  }
`;

export const SelectedUserItem = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  color: black;
  font-weight: var(--font-weight-regular);
  background: #f9f9f9;
  border: 1px solid #e5e5e5;

  svg {
    max-width: 8px;
    max-height: 8px;
  }

  &:focus {
    background: var(--input-hover);
  }

  &:hover {
    background: var(--input-hover);
  }

  &:active {
    background: var(--input-active);
  }
`;

export const SelectedUserWrapper = styled.div`
  margin: 10px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;
