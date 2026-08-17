import styled from "styled-components";
import BaseCard from "../../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  padding: 0 !important;
  width: 100% !important;
`;

export const Header = styled.div`
  background: rgba(115, 128, 148, 0.05);
  border-radius: 8px 8px 0 0;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
`;

export const Cell = styled.div`
  width: 72px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);

  &:first-child {
    width: 65px;
  }
  &:last-child {
    width: 87px;
  }
`;

export const Body = styled.div`
  padding: 0 16px 16px;
`;

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 2px solid #f8f8f9;
`;
