import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  margin-top: 20px;

  & .group-date {
    margin-top: 20px;
    font-weight: var(--font-weight-medium);
    font-size: 16px;
    line-height: 100%;
    color: var(--color-text-muted);
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  & .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    position: relative;
  }

  & .description {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    color: var(--main-gray);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    & .title {
      font-size: 20px;
    }
  }
`;

export const SearchKeywords = styled.div`
  max-width: 50%;
`;

export const Items = styled(BaseCard)`
  margin-top: 20px;
  width: 100%;
`;

export const ParsingItem = styled.div`
  display: grid;
  align-items: flex-start;
  grid-template-columns: 0.2fr 8.6fr 0.2fr;
  gap: 20px;
  padding: 20px 0;
  position: relative;

  @media (max-width: 768px) {
    & .open-btn {
      position: absolute;
      right: 16px;
      top: 16px;
    }

    & .tweet-date {
      position: absolute;
      right: 42px;
      top: 16px;
    }
  }

  & .tweet-actions {
    margin-top: 20px;
    display: flex;
    align-items: center;
    gap: 30px;

    & .tweet-like {
      display: flex;
      align-items: center;
      gap: 8px;

      span {
        color: var(--color-text-muted);
      }
      svg {
        width: 20px;
        height: 20px;
      }
    }
  }

  & .avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    object-fit: cover;
  }

  &:first-child {
    padding-top: 0px;
  }

  & .tweet {
    font-size: 14px;
    color: var(--main-black);
  }

  & .tweet-wrapper {
    display: grid;
    grid-template-columns: 7.1fr 1.5fr;
    justify-content: space-between;
  }

  & .tweet-date {
    max-width: fit-content;
    margin-left: auto;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    color: var(--main-gray);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px 0;

    & .tweet-wrapper {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    & .tweet-actions {
      gap: 20px;
    }
  }
`;
