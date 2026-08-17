import styled from "styled-components";

export const ModalRow = styled.div`
  p {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
    margin-bottom: 12px;

    color: var(--color-text-primary);
  }

  & .light-gray {
    & input::placeholder {
      color: var(--color-text-soft);
    }

    path {
      fill: var(--color-text-soft);
    }
  }

  &.left-icon-wrapper {
    position: relative;
    input {
      padding-left: 30px;
    }

    & .left-icon {
      position: absolute;
      z-index: 1;
      left: 12px;
      bottom: 8px;
      path {
        fill: var(--color-text-soft) !important;
      }
    }
  }

  &.right-icon-wrapper {
    position: relative;

    & .right-icon {
      position: absolute;
      z-index: 1;
      right: 12px;
      bottom: 8px;
      path {
        fill: var(--color-text-soft) !important;
      }
    }
  }
`;

export const HeaderWrapper = styled.div`
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

export const AddRoundBtn = styled.div`
  max-width: 100%;
  margin-top: 20px;

  button {
    width: 100%;
  }
`;

export const AddButton = styled.button`
  background: none;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: #05c9a1;
`;

export const FlagRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-muted);
  }

  input {
    background: #f8f8f9;
    border-radius: 8px;
    padding: 10px;
    width: 252px;
    border: none;
    margin-bottom: 8px;

    &:first-child {
      width: 224px;
    }
    &:last-child {
      width: 39px;
    }
  }
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 18px;
    line-height: 21px;
    color: var(--color-text-primary);
  }
`;

export const Total = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-muted);
  margin-top: 12px;
`;
