import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 25px;

  &.profile {
    gap: 15px;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 4px;
    padding: 6px;
    font-weight: var(--font-weight-regular);
    font-size: 10px;
    line-height: 100%;
  }

  @media (max-width: 768px) {
    width: 100%;
    gap: 12px;

    & > button {
      width: 100% !important;
      height: 36px !important;
    }

    & > .reset-btn {
      border: 1px solid var(--main-gray);
    }
  }

  & .green-btn {
    transition: all 0.3s ease;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);

    span {
      font-size: 10px;
    }

    &:hover {
      border: 1px solid #39816a;
      span {
        color: #39816a;
      }

      path {
        stroke: #39816a;
      }
    }

    &:active {
      border: 1px solid #2e6a58;
      span {
        color: #2e6a58;
      }

      path {
        stroke: #2e6a58;
      }
    }
  }

  & .red-btn {
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
    transition: all 0.3s ease;
    width: 120px;

    &:hover {
      border: 1px solidrgb(33, 34, 34);
      span {
        color: #e62727;
      }

      path {
        stroke: #e62727;
      }
    }

    &:active {
      border: 1px solid #c71919;
      span {
        color: #c71919;
      }

      path {
        stroke: #c71919;
      }
    }
  }

  & .reset-btn {
    width: 100px;
    color: var(--main-gray);
  }
`;
