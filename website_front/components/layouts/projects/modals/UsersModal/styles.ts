import styled from "styled-components";
import Modal from "../../../../global/common/Modal";

export const ModalWrapper = styled(Modal)`
  & > div:last-child {
    width: 464px !important;
    position: relative;
    padding: 24px 24px 32px 24px !important;
  }

  @media (max-width: 470px) {
    & > div:last-child {
      width: 100% !important;
    }
  }

  &.users-modal{
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.users-modal .overlay{
    background: rgba(0, 0, 0, 0);
  }

  &.users-modal.chat-fullscreen {
    align-items: center;
    justify-content: center;

    .modal-style {
      width: 464px !important;
      max-width: 464px !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: min(720px, calc(100vh - 32px)) !important;
      margin: 15px;
      border-radius: 8px;
      border: 1px solid rgba(83, 98, 124, 0.07);
    }

    .internal-wrapper {
      height: auto;
      min-height: 0;
      padding: 24px 24px 32px 24px !important;
    }
  }

  @media (max-width: 768px) {
    &.users-modal.chat-fullscreen {
      align-items: stretch;
      justify-content: stretch;

      .modal-style {
        width: 100% !important;
        max-width: 100% !important;
        height: 100vh !important;
        max-height: 100vh !important;
        margin: 0;
        border: none;
        border-radius: 0;
        padding: 12px !important;
      }

      .internal-wrapper {
        height: 100%;
        min-height: 0;
        padding: 0 !important;
      }

      .content {
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }

      .users-list {
        flex: 1 1 auto;
        height: auto;
        min-height: 0;
      }

      .users-actions {
        margin-top: 10px;
        padding-bottom: env(safe-area-inset-bottom);
      }
    }
  }
`;
export const SearchInput = styled.div`
  width: 100%;
  margin-top: 18px;
  .users-input {
    width: 100%;
  }

  input {
    width: 100%;
  }
`;
export const HeaderWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .close-btn {
    border: none;
    background: transparent;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

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
`;

export const UserRow = styled.div<{ isSelected: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 13px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 4px;

  &:hover {
    background: var(--input-hover);
  }

  background: ${({ isSelected }) => (isSelected ? "#04a58564" : "")} !important;

  p {
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
`;

export const UserDataWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;
export const AddUser = styled.div`
  margin-top: 8px;

  button {
    padding: 12px;
    width: 100%;
  }
`;
