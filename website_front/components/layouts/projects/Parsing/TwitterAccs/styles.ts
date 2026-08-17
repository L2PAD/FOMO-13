import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
`;

export const AccountCard = styled(BaseCard)`
  width: 100%;

  & .user-info {
    display: flex;
    align-items: start;
    gap: 20px;
    margin-bottom: 20px;

    img {
      max-width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
    }

    & .user-details {
      width: 100%;
    }

    & .user-name {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: var(--font-weight-semibold);
      font-size: 20px;
      margin-bottom: 4px;
    }

    & .user-description {
      font-size: 14px;
      color: var(--main-gray);
      margin-bottom: 4px;
    }

    & .followers-info {
      display: flex;
      justify-content: space-between;
    }

    & .followers-item {
      display: flex;
      align-items: center;
      gap: 4px;

      div {
        font-weight: var(--font-weight-semibold);
        font-size: 14px;
      }

      span {
        font-weight: var(--font-weight-regular);
        font-size: 14px;
        color: var(--main-gray);
      }
    }
  }

  & .tweet {
    font-size: 14px;
    margin-bottom: 8px;
  }

  & .tweet-date {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-text-muted);
  }

  & .nav-btn {
    max-width: fit-content;
    margin-top: auto;
    margin-left: auto;
  }
`;
