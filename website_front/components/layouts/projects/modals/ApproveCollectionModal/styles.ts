import styled from "styled-components";

export const ItemWrapper = styled.div`
  border: 1px solid #0000004d;
  border-radius: 18px;
  padding: 24px;
  margin-top: 16px;
  margin-bottom: 16px;
  display: flex;
  gap: 24px;
  align-items: center;

  img {
    width: 40px;
    height: 40px;
  }
`;

export const TextWrapper = styled.div`
  font-size: 14px;
  margin-top: 16px;
  margin-bottom: 16px;
`;

export const SubmitButton = styled.button`
  padding: 13px;
  background: var(--color-primary);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  text-align: center;
  color: var(--color-white);
  width: 100%;

  &:hover {
    background: rgba(4, 165, 132, 0.75);
  }
`;
