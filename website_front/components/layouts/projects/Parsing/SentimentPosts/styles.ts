import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  margin-top: 40px;

  @media (max-width: 767px) {
    margin-top: 24px;
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

  @media (max-width: 991px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;

    .title {
      font-size: 22px;
    }
    .description {
      font-size: 13px;
    }
  }

  @media (max-width: 575px) {
    .title {
      font-size: 20px;
    }
    .description {
      font-size: 12px;
    }
  }
`;

export const SearchKeywords = styled.div`
  max-width: 50%;

  @media (max-width: 1200px) {
    max-width: 65%;
  }

  @media (max-width: 991px) {
    max-width: 100%;
    margin-top: 12px;
  }
`;

export const Items = styled(BaseCard)`
  margin-top: 20px;
  width: 100%;

  @media (max-width: 575px) {
    border-radius: 12px;
  }
`;

export const ParsingItem = styled.div`
  display: grid;
  align-items: flex-start;
  grid-template-columns: 2.5fr 8.6fr 0.2fr;
  gap: 20px;
  border-bottom: 1px solid #f0f2f5;
  padding: 20px 0;
  position: relative;

  &:first-child {
    padding-top: 0px;
  }

  & .tweet {
    font-size: 14px;
    color: var(--main-black);
    /* prevent long links from causing overflow */
    overflow-wrap: anywhere;
    word-break: break-word;
    min-width: 0;
  }

  & .tweet-wrapper {
    display: grid;
    grid-template-columns: 7.1fr 1.5fr;
    justify-content: space-between;
    /* allow grid children to shrink */
    min-width: 0;

    & > * {
      min-width: 0;
    }
  }

  & .tweet-date {
    max-width: fit-content;
    margin-left: auto;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    color: var(--main-gray);
  }

  @media (max-width: 1200px) {
    grid-template-columns: 2fr 8fr 0.3fr;
  }

  @media (max-width: 991px) {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px 0;

    .tweet-wrapper {
      grid-template-columns: 1fr;
    }

    .tweet-date {
      margin-left: 0;
      margin-top: 6px;
      font-size: 13px;
    }

    .open-btn {
      position: absolute;
      top: 12px;
      right: 12px;
    }
  }

  @media (max-width: 575px) {
    .tweet {
      font-size: 13px;
      line-height: 1.4;
    }
  }
`;
