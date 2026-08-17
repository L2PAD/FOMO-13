import styled from "styled-components";
import BaseCard from "../../../../../../global/common/BaseCard";

export const Container = styled.div`
  padding-top: 10px;

  .labels {
    font-size: 12px;
    font-weight: var(--font-weight-regular);
    color: var(--color-text-muted);
  }

  .y-labels {
    display: grid;
    margin: 10px;
    margin-right: -60px;
    margin-top: 0;
    height: 285px;
    padding-top: -100px;
  }

  .x-labels {
    display: grid;
    grid-template-columns: repeat(13, 1fr);
    margin: 10px;
    margin-left: 20px;
    margin-top: -30px;
  }

  .chart {
    display: flex;
  }
`;

export const Wrapper = styled(BaseCard)`
  padding: 0 !important;
  width: 100% !important;
`;
