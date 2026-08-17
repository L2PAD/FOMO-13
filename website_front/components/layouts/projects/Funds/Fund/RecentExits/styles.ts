import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  margin: 40px 0px;
`;

export const Title = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29.4px;
`;

export const Items = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Item = styled(BaseCard)`
  position: relative;
  width: 100%;

  & .project-item {
    width: 32%;
  }

  & .close-icon {
    position: absolute;
    top: 8px;
    right: 12px;
  }

  & .header {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 12px;
    gap: 12px;

    &:has(input) {
      flex-wrap: wrap;

      & > div {
        width: 100%;
      }
    }
  }

  & .project {
    display: flex;
    align-items: center;
    gap: 8px;

    & .info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      div {
        font-weight: var(--font-weight-semibold);
        font-size: 14px;
        line-height: 17px;
        color: var(--main-black);
      }
      span {
        font-weight: var(--font-weight-regular);
        font-size: 14px;
        line-height: 16.8px;
        color: var(--main-gray);
      }
    }
  }
  & .investment {
    display: flex;
    flex-direction: column;
    gap: 4px;

    span {
      text-align: end;
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16.8px;
      color: var(--main-gray);
    }

    & .investment-header {
      display: inline;
      align-items: center;
      gap: 4px;
      span {
        font-size: 14px;
        line-height: 17px;
        color: var(--main-black);
      }
      .investment-value {
        font-weight: var(--font-weight-semibold);
        font-size: 14px;
        line-height: 17px;
        color: var(--main-black);
      }
    }
  }

  & .description {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16.8px;
    color: var(--main-black);
  }

  & .details {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    & .exit {
      display: flex;
      align-items: center;
      gap: 4px;

      div {
        font-size: 14px;
        line-height: 17px;
        color: var(--main-black);
      }

      span {
        font-weight: var(--font-weight-semibold);
        font-size: 14px;
        line-height: 17px;
        color: var(--main-black);
      }
    }

    & .roi {
      display: flex;
      align-items: center;
      gap: 4px;
      div {
        font-size: 14px;
        line-height: 17px;
        color: var(--main-black);
      }

      span {
        font-weight: var(--font-weight-semibold);
        font-size: 14px;
        line-height: 17px;
        color: var(--color-primary);
      }
    }
  }

  & .row-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 32%;
    input {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 100%;
      padding: 8px;
      border-radius: 8px;
      border: none;
      width: 100%;
      &::placeholder {
        color: var(--main-gray);
      }
      &::-webkit-calendar-picker-indicator {
        display: none;
      }
    }

    & .row-key {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
    }
  }

  & .project-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    input {
      background: white;
    }
    & .row-key {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
    }
  }

  & .description {
    textarea {
      background: white !important;
    }
  }
`;
