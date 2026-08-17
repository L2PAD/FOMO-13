import styled from "styled-components";
import BaseCard from "../common/BaseCard";

export const ParsingItem = styled(BaseCard)`
  width: 100%;
  padding: 20px 24px 24px;
  border: 1px solid #eef1f5;
  border-radius: 8px;
  background: var(--color-white);
  box-shadow: 2px 2px 8px 0px #00053014;

  & + & {
    margin-top: 12px;
  }

  .update-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .update-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  h3 {
    margin: 0;
    color: var(--main-black);
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    line-height: 20px;
  }

  time {
    flex-shrink: 0;
    color: var(--main-gray);
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 18px;
    white-space: nowrap;
  }

  .update-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 18px;
    padding: 2px 8px;
    border-radius: 4px;
    background: #eaf4ff;
    color: #2f80d5;
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    line-height: 14px;
    white-space: nowrap;
  }

  .update-text {
    max-width: 780px;
    margin: 12px 0 0;
    color: var(--color-text-muted);
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 18px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .update-text.expanded {
    display: block;
    -webkit-line-clamp: unset;
    overflow: visible;
  }

  .update-footer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    margin-top: 16px;
  }

  .toggle-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: none;
    background: transparent;
    color: #2f80d5;
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 18px;
    cursor: pointer;
  }

  .toggle-button svg {
    transition: transform 0.2s ease;
  }

  .toggle-button:not(.expanded) svg {
    transform: rotate(180deg);
  }

  .read-status {
    color: var(--main-gray);
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 18px;
  }

  @media (max-width: 767px) {
    padding: 16px;

    .update-header {
      flex-direction: column;
      gap: 8px;
    }

    .update-title-row {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .update-text {
      max-width: 100%;
    }
  }
`;
