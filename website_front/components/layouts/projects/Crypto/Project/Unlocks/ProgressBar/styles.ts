import styled from "styled-components";

export const Wrapper = styled.div`
  width: 100%;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  .item {
    display: flex;
    align-items: center;

    & .name {
      font-size: 16px;
      font-weight: var(--font-weight-semibold);
      line-height: 19.6px;
      margin: 0px 2px 0px 6px;
    }

    span {
      font-weight: 600 !important;
    }

    &.untracked{
      display: flex;
      gap: 6px;
      font-size: 14px;
      color: var(--main-gray);
    }
  }

  @media (max-width: 767px) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: center;
    gap: 6px;

    .item {
      min-width: 0;
      justify-content: center;
      gap: 3px;

      svg {
        display: none;
      }

      .name {
        margin: 0;
        font-size: 12px;
        line-height: 15px;
      }

      span,
      div {
        font-size: 12px;
        white-space: nowrap;
      }
    }
  }
`;

export const BarWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const Bar = styled.div`
  width: 100%;
  height: 12px;
  display: flex;
  overflow: hidden;
  border-radius: 10px;
  background: #eef1f5;
`;

export const SegmentTooltip = styled.div<{
  $left: number;
  $placement: "start" | "center" | "end";
}>`
  position: absolute;
  top: calc(100% + 10px);
  left: ${({ $left }) => `${$left}%`};
  z-index: 12;
  width: max-content;
  min-width: 210px;
  max-width: min(280px, calc(100vw - 32px));
  padding: 11px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: #0c1a2b;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.24);
  color: #d3d3d7;
  pointer-events: none;
  transform: ${({ $placement }) => {
    if ($placement === "start") return "translateX(0)";
    if ($placement === "end") return "translateX(-100%)";
    return "translateX(-50%)";
  }};

  &::after {
    content: "";
    position: absolute;
    top: -5px;
    left: ${({ $placement }) => {
      if ($placement === "start") return "14px";
      if ($placement === "end") return "calc(100% - 14px)";
      return "50%";
    }};
    width: 9px;
    height: 9px;
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: #0c1a2b;
    transform: translateX(-50%) rotate(45deg);
  }

  strong {
    display: block;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    color: #ffffff;
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 15px;
  }

  div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 8px;
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 15px;
  }

  span {
    color: #9797a0;
  }

  b {
    color: #ffffff;
    font-weight: var(--font-weight-semibold);
    text-align: right;
  }
`;

export const BarFill = styled.div<{
  width: number;
  variant?: "unlocked" | "untracked" | "locked";
}>`
  width: ${({ width }) => `${width}%`};
  height: 12px;
  flex: 0 0 ${({ width }) => `${width}%`};
  min-width: ${({ width }) => (width > 0 && width < 1 ? "2px" : "0")};
  cursor: help;
  transition:
    filter 0.2s ease,
    box-shadow 0.2s ease;
  background: ${({ variant = "unlocked" }) => {
    if (variant === "untracked") return "#d9dee7";
    if (variant === "locked") return "var(--color-danger)";
    return "linear-gradient(270deg, var(--color-primary) 0%, var(--color-primary) 100%)";
  }};

  &:not(:first-child) {
    box-shadow: inset 1px 0 rgba(255, 255, 255, 0.65);
  }

  &:hover,
  &:focus-visible {
    filter: brightness(1.04) saturate(1.12);
    outline: none;
  }
`;

export const Bottom = styled.div`
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  div {
    font-size: 14px;
    color: var(--color-text-primary);
  }

  @media (max-width: 767px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: 8px;

    div {
      min-width: 0;
      font-size: 12px;
      line-height: 15px;
      overflow-wrap: anywhere;

      &:last-child {
        text-align: right;
      }
    }
  }
`;
