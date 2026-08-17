import React, { FC, ReactNode } from "react";
import styled from "styled-components";
import { Info } from "lucide-react";
import { mainGlobalDark } from "../../../../../styles/mainGlobalDark";

interface TableTitleInfoProps {
  children: ReactNode;
  tooltip: string;
  className?: string;
  style?: React.CSSProperties;
}

const TableTitleInfo: FC<TableTitleInfoProps> = ({
  children,
  tooltip,
  className,
  style,
}) => {
  return (
    <Wrapper className={className} style={style}>
      {children}
      <TooltipHost tabIndex={0} aria-label={tooltip}>
        <Info size={15} strokeWidth={2} />
        <Tooltip role="tooltip">{tooltip}</Tooltip>
      </TooltipHost>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 100%;
  position: relative;

  h2,
  h3,
  p {
    margin-bottom: 0 !important;
  }
`;

const TooltipHost = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  color: var(--color-text-muted);
  cursor: help;
  outline: none;
  z-index: 5;

  &:hover,
  &:focus {
    color: var(--color-primary);
  }
`;

const Tooltip = styled.span`
  position: absolute;
  left: 50%;
  top: calc(100% + 9px);
  width: max-content;
  max-width: 260px;
  padding: 9px 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.24);
  color: ${mainGlobalDark.text};
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  line-height: 16px;
  text-align: left;
  white-space: normal;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -6px);
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
  z-index: 40;

  ${TooltipHost}:hover &,
  ${TooltipHost}:focus & {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  @media (max-width: 575px) {
    left: auto;
    right: 0;
    max-width: calc(100vw - 32px);
    transform: translate(0, -6px);

    ${TooltipHost}:hover &,
    ${TooltipHost}:focus & {
      transform: translate(0, 0);
    }
  }
`;

export default TableTitleInfo;
