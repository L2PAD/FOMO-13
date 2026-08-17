import styled from "styled-components";

export const CompareRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

export const CompareLabel = styled.div`
  font-size: 14px;
  color: var(--color-text-primary);
`;

export const CompareValue = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  text-align: right;
`;

export const CompareBadge = styled.span`
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #e9f8f8;
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
`;

export const CompareValueList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;
