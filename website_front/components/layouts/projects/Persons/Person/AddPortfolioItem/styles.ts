import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  margin: 20px 0;
`;

export const List = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Item = styled(BaseCard)`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  padding: 40px 20px 20px;

  & .remove-btn {
    position: absolute;
    top: 8px;
    right: 12px;
  }

  & .row-item {
    display: grid;
    align-items: center;
    grid-template-columns: 1.7fr 6fr;

    & .project-input {
      input {
        padding: 8px 8px 8px 36px;
      }
    }

    & .date-input::-webkit-calendar-picker-indicator {
      display: none;
    }

    & .date-input {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 100%;
      color: var(--main-gray);
    }

    input {
      font-size: 14px;
      line-height: 100%;
      padding: 8px;
      border-radius: 8px;
      border: none;
      width: 100%;
      background: white;
      &::placeholder {
        color: var(--main-gray);
      }
    }

    & .row-key {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 100%;
    }

    & .inputs-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      & .left-icon {
        position: absolute;
        top: 6px;
        left: 6px;
      }

      input {
        padding-left: 20px;
      }
    }

    & .status-items {
      display: flex;
      gap: 12px;

      & .status-item {
        display: flex;
        align-items: center;
        gap: 8px;

        label {
          font-weight: var(--font-weight-regular);
          font-size: 12px;
          line-height: 100%;
        }
      }
    }
  }
`;
