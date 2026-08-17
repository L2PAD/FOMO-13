import styled from "styled-components";

export const EmptyWrapper = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;

  img {
    height: auto;
  }

  div {
    font-size: 24px;
    font-weight: var(--font-weight-regular);
    line-height: 220%;
    text-align: center;
    color: var(--color-text-muted);
  }
`;
