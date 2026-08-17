import styled from "styled-components";
import Typography from "../Typography";

export const ProgressBarWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const Title = styled(Typography)`
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
`;

export const BarWrapper = styled.div`
  background: #f3f4f6;
  height: 8px;
  border-radius: 8px;
  width: 100%;

  ${ProgressBarWrapper}.hero-range-bar & {
    height: 10px;
    overflow: visible;
    background: rgba(7, 11, 53, 0.07);
  }
`;

export const Bar = styled.div<{ progress: number }>`
  height: 8px;
  border-radius: 8px;
  background: linear-gradient(270deg, var(--color-primary) 0%, var(--color-primary) 100%);
  width: ${({ progress }) => ` ${progress}% `};
  transition: width 0.32s ease;

  ${ProgressBarWrapper}.hero-range-bar & {
    position: relative;
    height: 10px;
    min-width: ${({ progress }) => (progress > 0 ? "10px" : "0")};
    background: linear-gradient(90deg, #4f46e5 0%, var(--color-primary) 100%);
    box-shadow: rgba(4, 165, 132, 0.18) 0 3px 8px;
  }

  ${ProgressBarWrapper}.hero-range-bar &::after {
    content: ${({ progress }) => (progress > 0 ? '""' : "none")};
    position: absolute;
    top: 50%;
    right: -5px;
    width: 10px;
    height: 10px;
    border: 2px solid var(--color-white);
    border-radius: 50%;
    background: var(--color-primary);
    box-shadow: rgba(0, 5, 48, 0.14) 0 2px 6px;
    transform: translateY(-50%);
  }
`;

export const DescriptionWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const DescriptionTitle = styled(Typography)`
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 14px;

  &.bold {
    font-weight: var(--font-weight-semibold);
  }
`;

export const DescriptionValue = styled.span`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 14px;
`;
