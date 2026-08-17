import styled from "styled-components";

export const ContentWrapper = styled.div`
  margin-top: 40px;
  display: flex;
  gap: 40px;
  flex-direction: column;
  align-items: center;

  .buttons {
    margin-top: 0;
  }
`;

export const SubmitButton = styled.button`
  padding: 13px;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-white);
  background: var(--color-primary);
  border-radius: 8px;
  border: none;
  width: 100%;
`;

export const UserWrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
`;

export const InfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 140px;
  justify-content: space-between;
  align-items: flex-end;

  & > div {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;

    &:first-child {
      flex-direction: column;
      align-items: flex-end;
      font-size: 14px;

      b {
        font-weight: var(--font-weight-regular);
      }
    }

    & > div {
      margin-top: 0;
    }

    a > svg {
      width: 24px;
      height: 24px;

      path {
        fill: var(--color-text-muted);
      }
    }
  }
`;

export const UserAvatarWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 12px;

  button {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: #e42736;
    border: none;
    background: none;
    margin-top: 10px;
  }

  b {
    font-size: 16px;
  }

  span {
    font-size: 14px;
    color: var(--color-text-muted);
  }
`;

export const RatingFlagsWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
`;

export const DataRowWrapper = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 30px 80px 1fr;
  align-items: center;
  justify-content: center;
  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 6px;
  }

  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    gap: 6px;
    align-items: center;
  }

  a {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-primary);
  }

  @media (max-width: 600px) {
    grid-template-columns: 24px 1fr;
    row-gap: 6px;
    b {
      font-size: 14px;
    }
    a {
      word-break: break-all;
    }
  }
`;
