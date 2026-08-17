import styled from "styled-components";

export const Wrapper = styled.div`
  height: 500px;
  width: 100%;
`;

export const Chart = styled.div`
  transform: translateX(95px);
  max-width: 100%;
  height: 400px;

  & .recharts-cartesian-axis-ticks {
    display: none;
  }
  & .recharts-responsive-container {
  }

  & .recharts-bar-rectangles {
    & .recharts-bar-rectangle:last-child {
      path {
        fill: #fb9b9c;
        stroke: var(--color-danger);
      }
    }
  }

  & .recharts-cartesian-grid-horizontal line {
    &:last-child {
      display: none;
    }
    &:nth-last-child(2) {
      display: none;
    }
  }
`;
