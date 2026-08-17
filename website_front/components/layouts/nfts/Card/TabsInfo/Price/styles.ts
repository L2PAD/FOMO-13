import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  padding: 19px 12px 0 !important;
  width: max-content !important;

  .recharts-wrapper {
    margin-left: -40px;
  }
  svg {
    font-size: inherit !important;
  }
`;

export const TooltipWrapper = styled.div`
  background: var(--color-text-primary);
  border-right: 8px;
  color: white;
  padding: 5px 10px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;
