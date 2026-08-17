import styled from "styled-components";
import BaseCard from "../../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;

  @media (max-width: 575px) {
    padding: 14px;
    border-radius: 12px;
  }
`;

export const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;

  div {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    padding: 10px;
    color: var(--main-gray);
  }

  @media (max-width: 575px) {
    grid-template-columns: 1fr;

    div:last-child {
      display: none;
    }
  }
`;

export const Body = styled.div``;

export const Row = styled.div`
  position: relative;
  display: grid;
  align-items: center;
  grid-template-columns: 1fr 1.5fr;
  gap: 8px;
  border-top: 1px solid #f0f2f5;

  div {
    font-size: 14px;
    padding: 25.5px 10px;
  }

  & .key {
    font-weight: var(--font-weight-semibold);
  }

  input {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    padding: 8px;
    border-radius: 8px;
    border: none;
    margin: 8px 0px;
    &::placeholder {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 100%;
      color: var(--main-gray);
    }
  }

  button {
    position: absolute;
    top: 12px;
    right: 4px;
  }

  @media (max-width: 575px) {
    grid-template-columns: 1fr;
    gap: 0;

    div {
      padding: 12px 8px;
    }

    div:not(.key) {
      padding-top: 0;
      color: var(--main-gray);
    }
  }
`;
