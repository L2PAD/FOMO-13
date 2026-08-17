import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;

  /* keep avatar width stable, allow info to shrink */
  & > *:first-child {
    flex: 0 0 auto;
  }

  & .info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    /* critical for text truncation inside flex */
    min-width: 0;
    width: 100%;
    flex-grow: 1;
  }

  & .name {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-black);
    /* truncate long names */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & .description {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-gray);
    /* dynamically use available width */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  & .username {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    letter-spacing: 0%;
    color: var(--main-green);
    /* truncate if needed */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & .followers-info {
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 40px;
  }

  & .followers-info-item {
    gap: 4px;

    span {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
    }

    div {
      font-size: 14px;
      color: var(--main-gray);
    }
  }

  /* adaptive tweaks */
  @media (max-width: 991px) {
    gap: 6px;

    .name,
    .username {
      font-size: 13px;
    }
    .description {
      font-size: 13px;
    }
    .followers-info {
      gap: 16px;
      flex-wrap: wrap;
    }
  }

  @media (max-width: 575px) {
    .name {
      font-size: 13px;
    }
    .username,
    .description {
      font-size: 12px;
    }
    .followers-info-item span,
    .followers-info-item div {
      font-size: 12px;
    }
  }
`;
