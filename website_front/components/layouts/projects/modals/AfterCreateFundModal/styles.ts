import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Title = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  text-align: center;
  margin-bottom: 12px;
`;

export const Description = styled.span`
  display: flex;
  align-items: center;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  text-align: center;
  margin-bottom: 32px;
`;

export const SubmitButton = styled.button`
  width: 310px;
  background: var(--color-primary);
  border-radius: 8px;
  padding: 13px;
  margin: 0 auto;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-white);
  text-align: center;
  transition: 0.3s;
  border: none;

  &:hover {
    background: rgba(4, 165, 132, 0.75);
  }
`;
