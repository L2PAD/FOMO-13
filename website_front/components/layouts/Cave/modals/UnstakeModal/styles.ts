import styled from "styled-components";
import Modal from "../../../../global/common/Modal";

export const TableWrapper = styled.div`
  & > div {
    & > div:first-child {
      background: #f8f8f9;
      padding: 16px 11px;
      border-radius: 8px;
      & > p {
        &:first-child {
          width: 169px;
        }
        &:nth-child(2) {
          width: 160px;
        }
        &:nth-child(3) {
          width: 140px;
        }
        &:nth-child(4) {
          width: 200px;
        }
        &:nth-child(5) {
          width: auto;
        }
      }
    }
    & > div:last-child {
      gap: 0;
      & > div {
        box-shadow: none;
        border: none;
        border-bottom: 2px solid #f5f9fd;
        & > div {
          &:first-child {
            width: 169px;
          }
          &:nth-child(2) {
            width: 160px;
          }
          &:nth-child(3) {
            width: 140px;
          }
          &:nth-child(4) {
            width: 200px;
          }
          &:nth-child(5) {
            width: auto;
          }
        }
      }
    }
    & > div:last-child {
      padding: 0;
    }
  }
`;

export const ModalWrapper = styled(Modal)``;

export const SubmitButton = styled.div`
  margin-top: 16px;
  width: 100%;
  background: var(--color-primary-soft);
  border-radius: 8px;
  border: none;
  padding: 12px;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-primary);
  text-align: center;
  transition: 0.3s;

  &:hover {
    color: white;
    background-color: var(--color-primary);
  }
`;
