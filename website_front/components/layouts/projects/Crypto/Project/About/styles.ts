import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";
import { mainGlobalDark } from "../../../../../../styles/mainGlobalDark";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  background: rgb(255, 255, 255);
  border: 1px solid var(--Stroke, #f0f2f5);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  border-radius: 12px;

  & .about-project {
    & p:first-child {
      margin-top: 20px;
    }
  }

  &.market-project-about {
    background: rgb(255, 255, 255);
    border-color: var(--Stroke, #f0f2f5);
    box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  }

  h2 {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    line-height: 29.4px;
    color: var(--color-text-primary);
  }

  &.market-project-about h2 {
    color: var(--color-text-primary);
  }

  p {
    margin-top: 12px;
    margin-bottom: 20px;
    font-size: 16px;
    line-height: 22px;
    color: var(--color-text-secondary);
  }

  &.market-project-about p {
    color: var(--color-text-secondary);
  }

  a {
    color: var(--main-blue);
    cursor: pointer;
  }

  &.market-project-about a {
    color: var(--main-blue);
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

  &.market-project-about ul li::before {
    background: ${mainGlobalDark.positive};
  }

  @media (max-width: 575px) {
    padding: 16px;
    border-radius: 12px;

    h2 {
      font-size: 20px;
      line-height: 24px;
    }

    p {
      margin-bottom: 16px;
      font-size: 14px;
      line-height: 20px;
    }
  }
`;

export const AboutPageLinks = styled.div``;

export const LinksWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  a {
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

  ${Wrapper}.market-project-about & a {
    padding: 7px 10px;
    border: 1px solid #f0f2f5;
    border-radius: 8px;
    background: var(--color-surface-subtle);
    color: var(--color-text-secondary);
    text-decoration: none;
  }

  ${Wrapper}.market-project-about & a:hover {
    border-color: rgba(4, 165, 132, 0.18);
    background: var(--color-white);
  }

  ${Wrapper}.market-project-about & a span {
    color: var(--color-text-secondary);
  }

  @media (max-width: 575px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    a {
      flex: 0 0 auto;
      white-space: nowrap;
    }
  }
`;

export const SearchItems = styled.div`
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

  ${Wrapper}.market-project-about & button {
    padding: 7px 10px;
    border: 1px solid #f0f2f5;
    border-radius: 8px;
    background: var(--color-surface-subtle);
    color: var(--color-text-secondary);

    path {
      stroke: var(--color-text-muted);
      fill: var(--color-text-muted);
    }
  }

  ${Wrapper}.market-project-about & button:hover {
    border-color: rgba(4, 165, 132, 0.18);
    background: var(--color-white);
  }

  @media (max-width: 575px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    button {
      flex: 0 0 auto;
      white-space: nowrap;
    }
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

  ${Wrapper}.market-project-about & > div:not(.hidden-categories-popover) {
    padding: 7px 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: ${mainGlobalDark.backgroundHover};
    color: ${mainGlobalDark.text};

    path {
      stroke: ${mainGlobalDark.textMuted};
    }
  }

  .hidden-categories-popover {
    position: relative;
    z-index: 20;
  }

  .hidden-categories-count {
    background: var(--color-surface-subtle);
    border: 1px solid #eef2f6;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    font-size: 12px;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    flex-shrink: 0;
    z-index: 10;
  }

  ${Wrapper}.market-project-about & .hidden-categories-count {
    border-color: rgba(255, 255, 255, 0.08);
    background: ${mainGlobalDark.backgroundHover};
    color: ${mainGlobalDark.text};
  }

  .hidden-categories-dropdown {
    position: absolute;
    top: 100%;
    left: -10px;
    display: none;
    min-width: 160px;
    max-width: 240px;
    padding: 10px 12px;
    background: var(--color-white);
    border: 1px solid var(--main-stroke);
    border-radius: 8px;
    box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    z-index: 30;
  }

  ${Wrapper}.market-project-about & .hidden-categories-dropdown {
    background: ${mainGlobalDark.background};
    border-color: ${mainGlobalDark.border};
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.24);
  }

  .hidden-categories-popover:hover .hidden-categories-dropdown {
    display: flex;
  }

  .hidden-category-item {
    display: block;
    color: var(--color-text-muted);
    font-size: 14px;
    line-height: 18px;
    white-space: nowrap;
  }

  ${Wrapper}.market-project-about & .hidden-category-item {
    color: ${mainGlobalDark.text};
  }

  @media (max-width: 575px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    & > div,
    .hidden-categories-popover {
      flex: 0 0 auto;
    }

    .hidden-categories-dropdown {
      left: auto;
      right: 0;
      max-width: min(240px, calc(100vw - 32px));
    }
  }
`;

export const SearchWrapper = styled.div`
  position: relative;

  & .search-dropdown {
    position: absolute;
    top: 24px;
    left: 0px;
    z-index: 1;
    background: white;
    padding: 8px;
    border: 1px solid var(--Stroke, #f0f2f5);
    box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
    border-radius: 8px;

    display: none;
    flex-direction: column;
    gap: 8px;

    a {
      color: var(--color-text-muted);
      font-size: 14px;
    }
  }

  ${Wrapper}.market-project-about & .search-dropdown {
    background: var(--color-white);
    border-color: var(--Stroke, #f0f2f5);
    box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;

    a {
      color: var(--color-text-muted);
      text-decoration: none;
    }

    a:hover {
      color: var(--color-primary);
    }
  }

  &:hover .search-dropdown {
    display: flex;
  }

  @media (max-width: 575px) {
    & .search-dropdown {
      top: calc(100% + 8px);
      width: max-content;
      max-width: min(260px, calc(100vw - 32px));
    }
  }

`;
