import styled from "styled-components";

export const RangeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const RangeValues = styled.div`
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 14px;
  display: flex;
  justify-content: space-between;

  p {
    display: flex;
    align-items: center;
  }
`;

export const InputRangeValue = styled.input`
  max-width: 70px;
  text-align: center;
  border: none;
  background: #f4f4f4ff;
  color: rgb(7, 11, 53);
  font-weight: var(--font-weight-medium);
  padding: 4px 6px;
  border-radius: 6px;
`;

export const Label = styled.div``;
