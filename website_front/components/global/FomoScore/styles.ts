import styled from "styled-components";

export const FomoScoreWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  span {
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  svg {
    flex-shrink: 0;
  }

  .row {
    width: 76px;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: 4px;
  }
`;
