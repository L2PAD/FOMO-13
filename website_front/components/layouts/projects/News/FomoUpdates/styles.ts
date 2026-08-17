import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  & .group-date {
    margin-top: 12px;
    margin-bottom: 24px;
    font-weight: var(--font-weight-medium);
    font-size: 16px;
    line-height: 100%;
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  @media (max-width: 768px) {
    gap: 8px;

    & .group-date {
      margin-bottom: 16px;
      font-size: 14px;
    }
  }
`;

export const UpdatesList = styled.div`
  &.skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .update-skeleton-card {
    width: 100%;
    padding: 20px 24px 24px;
    border: 1px solid #eef1f5;
    border-radius: 8px;
    background: var(--color-white);
    box-shadow: 2px 2px 8px 0px #00053014;
  }

  .skeleton-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .skeleton-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    width: min(420px, 100%);
  }

  .skeleton-body {
    margin-top: 16px;
    max-width: 780px;
  }

  .skeleton-footer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    margin-top: 18px;
  }

  @media (max-width: 767px) {
    .update-skeleton-card {
      padding: 16px;
    }

    .skeleton-header {
      flex-direction: column;
      gap: 10px;
    }

    .skeleton-title-row {
      width: 100%;
    }
  }
`;
