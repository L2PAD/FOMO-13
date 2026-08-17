import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  width: 100%;

  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    margin-bottom: 20px;
  }
`;

export const Body = styled(BaseCard)`
  width: 100%;
  font-size: 16px;

  span {
    font-weight: var(--font-weight-semibold);
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  li {
    a {
      font-weight: var(--font-weight-semibold);
      color: var(--color-primary);
    }
  }
`;

export const SocialMediaInfo = styled.div`
  margin-top: 40px;
  display: flex;
  flex-direction: column;

  & .media-title {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 100%;
    color: var(--main-gray);
  }

  & .links-items {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;

    @media (max-width: 768px) {
      flex-direction: column;
    }

    a {
      max-width: fit-content;
      display: flex;
      align-items: center;
      gap: 4px;
      width: 100%;

      img {
        width: 20px;
        height: 20px;
        border-radius: 50%;
      }

      span {
        font-size: 14px;
        color: var(--color-text-muted);
        font-weight: var(--font-weight-regular);
        width: 100%;
        text-align: left;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }
`;

export const PersonDetailsBlock = styled(BaseCard)`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const DetailsTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 100%;
  letter-spacing: 0%;
`;

export const DetailsItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;

  &.row-item {
    flex-direction: row;
    align-items: center;
  }

  & .detail-value {
    font-weight: var(--font-weight-semibold);
  }

  & .detail-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-black);
  }

  & .detail-dote {
    width: 5px;
    height: 5px;
    background: var(--main-black);
    border-radius: 50%;
  }

  & .detail-name {
    font-size: 14px;
  }

  & .detail-date {
    font-size: 14px;
    color: var(--main-gray);
  }

  & .small-dote {
    width: 3px;
    height: 3px;
    background: var(--main-black);
    border-radius: 50%;
    margin-right: 4px;
  }

  a {
    color: var(--main-green);
  }
`;

export const DetailsItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  &.small-items {
    gap: 8px;

    & .detail-dote {
      width: 3px;
      height: 3px;
      background: var(--main-black);
      border-radius: 50%;
    }

    & .detail-title {
      font-weight: var(--font-weight-regular);
    }
  }
`;
