import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  width: 35%;
  display: flex;
  flex-direction: column;
  gap: 20px;

  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
  }
`;

export const Card = styled(BaseCard)`
  width: 100%;
`;

export const CardRow = styled.div`
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  div {
    font-size: 14px;
  }
  & .key {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: var(--font-weight-semibold);
    color: var(--main-gray);
  }

  & .bold {
    font-weight: var(--font-weight-semibold);
  }

  button {
    height: 14px;
  }
`;

export const DescriptionWrapper = styled.div`
  & .description-component {
    width: 300px;
    padding: 10px;
    z-index: 1;
    background: white;
    position: absolute;
    top: 30px;
    left: -10px;
    div {
      font-size: 14px;
      color: var(--main-gray);

      p {
        margin: 8px 0;
      }
    }
  }
`;
