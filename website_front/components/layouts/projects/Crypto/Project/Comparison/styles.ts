import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";
import { mainGlobalDark } from "../../../../../../styles/mainGlobalDark";

export const Wrapper = styled.div`
  h2 {
    color: var(--color-text-primary);
  }

  .comparison-section-title {
    margin-bottom: 16px;
  }

  @media (max-width: 768px) {
    h2 {
      font-size: 20px;
      line-height: 24px;
    }

    .comparison-section-title {
      margin-bottom: 12px;
    }
  }
`;

export const Body = styled(BaseCard)<{ $dark?: boolean }>`
  width: 100%;
  background: ${({ $dark }) =>
    $dark ? mainGlobalDark.background : "var(--color-white)"};
  border: 1px solid
    ${({ $dark }) => ($dark ? mainGlobalDark.border : "var(--Stroke, #f0f2f5)")};
  box-shadow: ${({ $dark }) =>
    $dark
      ? "0 16px 34px rgba(0, 0, 0, 0.16)"
      : "rgba(0, 5, 48, 0.08) 2px 2px 8px 0px"};

  @media (max-width:1000px) {
      min-width:100px;
      overflow: auto;
  }
`;
export const Header = styled.div<{ $dark?: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  gap: ${({ $dark }) => ($dark ? "12px" : "0")};

  & .small-select {
    width: 190px;
  }

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-start;

    & .small-select {
      width: min(220px, 100%);
    }
  }
`;

export const Overflow = styled.div` 

    @media (max-width:1000px) {
      min-width: 800px;
      overflow: auto;
  }
`

export const ProjectWrapper = styled.div<{ $dark?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;

  & .name {
    color: ${({ $dark }) =>
      $dark ? mainGlobalDark.white : "var(--color-text-primary)"};
    font-weight: var(--font-weight-semibold);
  }
`;

export const BlockchainSelect = styled.div<{ $dark?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0px 55px 0px 12px;
  min-width:fit-content;
  padding: ${({ $dark }) => ($dark ? "7px 10px" : "0")};
  border: 1px solid
    ${({ $dark }) => ($dark ? "rgba(255, 255, 255, 0.08)" : "transparent")};
  border-radius: ${({ $dark }) => ($dark ? "8px" : "0")};
  background: ${({ $dark }) =>
    $dark ? mainGlobalDark.backgroundHover : "transparent"};

  color: ${({ $dark }) =>
    $dark ? mainGlobalDark.positive : "var(--color-primary)"};
  font-size: 16px;
  font-weight: var(--font-weight-semibold);

  @media (max-width: 768px) {
    margin: 0;
    font-size: 14px;
  }
`;

export const CompareWrapper = styled.div<{ $dark?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  & .label {
    color: ${({ $dark }) =>
      $dark ? mainGlobalDark.textMuted : "var(--color-text-muted)"};
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 17.15px;
    opacity: 1;
  }

  @media (max-width: 768px) {
    flex: 1 1 100%;
    flex-wrap: wrap;
  }
`;

export const ButtonsWrapper = styled.div`
  display: flex;

  button {
    font-size: 16px;
    padding: 9px 11.5px;
  }

  @media (max-width: 768px) {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    button {
      flex: 0 0 auto;
      font-size: 13px;
      padding: 8px 10px;
      white-space: nowrap;
    }
  }
`;

export const Table = styled.div``;

export const Row = styled.div<{ isNeutral?: boolean; $dark?: boolean }>`
  display: grid;
  align-items: center;
  grid-template-columns: 0.3fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 1.2fr;
  padding: 8px 10px;
  background: ${({ isNeutral, $dark }) =>
    $dark
      ? isNeutral
        ? mainGlobalDark.backgroundHover
        : "transparent"
      : isNeutral
        ? "white"
        : "transparent"};
  border-top: 1px solid
    ${({ $dark }) => ($dark ? mainGlobalDark.border : "#f0f2f5")};
  color: ${({ $dark }) => ($dark ? mainGlobalDark.text : "inherit")};

  & .number {
    font-size: 12px;
    color: ${({ $dark }) =>
      $dark ? mainGlobalDark.textMuted : "var(--color-text-primary)"};
  }

  & div:nth-child(2) {
    display: flex;
    gap: 8px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: ${({ $dark }) => ($dark ? mainGlobalDark.white : "inherit")};
    img {
      width: 20px;
      height: 20px;
      object-fit: cover;
      border-radius: 50%;
    }
  }

  & div:last-child {
    display: flex;
    justify-content: space-between;
    margin-right: 10px;
  }

  & div:nth-child(3) {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: ${({ $dark }) => ($dark ? mainGlobalDark.text : "inherit")};
  }

  & div:nth-child(4) span {
    margin-left: 0px;
  }
  & div:nth-child(5) span {
    margin-left: 0px;
  }

  & div:nth-child(6) {
    font-size: 14px;
    color: ${({ $dark }) => ($dark ? mainGlobalDark.text : "inherit")};
  }

  & div:nth-child(7) {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: ${({ $dark }) => ($dark ? mainGlobalDark.white : "inherit")};
  }

  &.ico {
    grid-template-columns: 0.4fr 1.7fr 1.25fr 1.25fr 1.25fr 1.95fr;

    & div:nth-child(3) {
      font-size: 14px;
      font-weight: var(--font-weight-regular);
      text-align: right;
    }

    & div:nth-child(4) {
      font-size: 14px;
      font-weight: var(--font-weight-regular);
      text-align: right;
    }
    & div:nth-child(5) {
      font-size: 14px;
      font-weight: var(--font-weight-regular);
      margin-left: 18px;
    }
  }
`;
export const TableHeader = styled.div<{ $dark?: boolean }>`
  display: grid;
  grid-template-columns: 0.3fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 1.2fr;
  padding: 6.5px 10px;
  border-bottom: 1px solid
    ${({ $dark }) => ($dark ? mainGlobalDark.border : "transparent")};

  div {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 17.15px;
    color: ${({ $dark }) =>
      $dark ? mainGlobalDark.textMuted : "var(--color-text-muted)"};
  }

  button {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 17.15px;
    color: ${({ $dark }) =>
      $dark ? mainGlobalDark.textMuted : "var(--color-text-muted)"};
  }

  &.ico {
    grid-template-columns: 0.4fr 1.7fr 1.25fr 1.25fr 1.25fr 1.95fr;

    & div:nth-child(3) {
      text-align: right;
    }

    & div:nth-child(4) {
      text-align: right;
    }
    & div:nth-child(5) {
      margin-left: 18px;
    }
    & div:nth-child(6) {
      justify-self: right;
      margin-right: 10px;
    }

    & .info {
      position: relative;
    }
  }
`;

export const RowsWrapper = styled.div``;

export const EmptyStateWrapper = styled.div`
  padding: 16px 0;
`;

export const GainWrapper = styled.div<{
  isGrow: boolean;
  isNeutral?: boolean;
  $dark?: boolean;
}>`
  padding: 8px 16px;
  background: ${({ isGrow, isNeutral, $dark }) =>
    $dark
      ? isNeutral
        ? mainGlobalDark.backgroundHover
        : isGrow
          ? "linear-gradient(90deg, rgba(0, 221, 115, 0) 0%, rgba(0, 221, 115, 0.12) 100%)"
          : "linear-gradient(90deg, rgba(255, 88, 88, 0) 0%, rgba(255, 88, 88, 0.14) 100%)"
      : isNeutral
        ? "white"
        : isGrow
          ? "linear-gradient(90deg, rgba(217, 241, 237, 0) 0%, #D9F1ED 100%)"
          : "linear-gradient(90deg, rgba(253, 234, 235, 0) 0%, #FDEAEB 100%)"};
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;

  .roi-x,
  .roi-percent,
  .empty-value {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    white-space: nowrap;
  }

  &.ico-gain {
    min-width: 210px;
    gap: 10px;
  }

  .roi-x {
    color: ${({ $dark }) =>
      $dark ? mainGlobalDark.white : "var(--color-text-primary)"};
  }

  .roi-percent {
    color: ${({ isGrow }) => (isGrow ? "var(--color-primary)" : "var(--color-danger)")};
  }

  .empty-value {
    color: ${({ $dark }) =>
      $dark ? mainGlobalDark.textMuted : "var(--color-text-muted)"};
  }
`;

export const PerformanceHeader = styled.div<{ $dark?: boolean }>`
  margin-top: 40px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;

  h3 {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: ${({ $dark }) =>
      $dark ? mainGlobalDark.white : "var(--color-text-primary)"};
  }

  & .performance-modal {
    position: absolute;
    top: 35px;
    right: 40px;
    max-width: 240px;
  }

  @media (max-width: 768px) {
    margin-top: 28px;
    margin-bottom: 14px;
    align-items: flex-start;
    gap: 12px;
    flex-direction: column;

    h3 {
      font-size: 20px;
      line-height: 24px;
    }

    & .performance-modal {
      right: 0;
      max-width: min(280px, calc(100vw - 32px));
    }
  }
`;

export const PerformanceButton = styled.button<{
  isBullish: boolean;
  $dark?: boolean;
}>`
  padding: 8px 12px;
  width: 90px;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 12.25px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: default;
  color: ${({ isBullish }) => (isBullish ? "var(--color-primary)" : "var(--color-danger)")};
  background: ${({ isBullish, $dark }) =>
    $dark
      ? isBullish
        ? "rgba(0, 221, 115, 0.12)"
        : "rgba(255, 88, 88, 0.14)"
      : isBullish
        ? "var(--color-surface-subtle)"
        : "#FDEAEB"};
  border: 1px solid
    ${({ isBullish, $dark }) =>
      $dark
        ? isBullish
          ? "rgba(0, 221, 115, 0.26)"
          : "rgba(255, 88, 88, 0.26)"
        : isBullish
          ? "#eef2f6"
          : "#FDEAEB"};
  border-radius: 4px;
`;
