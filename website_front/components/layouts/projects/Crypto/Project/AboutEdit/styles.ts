import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;

  h2 {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    line-height: 29.4px;
    color: var(--color-text-primary);
  }
  p {
    margin-top: 12px;
    margin-bottom: 20px;
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-primary);
  }

  ul {
    margin-top: 12px;
    margin-bottom: 20px;
    li {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    li::before {
      content: "";
      display: block;
      background: var(--main-black);
      min-width: 4px;
      min-height: 4px;
      max-width: 4px;
      max-height: 4px;
      border-radius: 100px;
    }
  }
`;

export const AboutPageLinks = styled.div``;

export const LinksWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  div {
    display: flex;
    align-items: center;
    gap: 4px;

    img {
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }

    span {
      font-size: 14px;
      color: var(--color-text-muted);
    }
  }
`;

export const SearchWrapper = styled.div`
  margin-top: 12px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;

  button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 5px;
    border-radius: 4px;
    background: var(--color-white);
    color: var(--color-text-muted);
    font-size: 14px;
  }
`;

export const Categories = styled.div`
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  div {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-text-muted);
    font-size: 14px;
  }
`;
