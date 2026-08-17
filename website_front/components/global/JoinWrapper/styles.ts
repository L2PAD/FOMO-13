import styled from "styled-components";
import Typography from "../common/Typography";

export const PageWrapper = styled.div`
  background: var(--color-primary);
  padding: 80px 16px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Title = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 32px;
  line-height: 39px;
  color: var(--color-white);
  margin-bottom: 7px !important;
`;

export const Description = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  text-align: center;
  color: var(--color-white);
  margin-bottom: 24px !important;
  width: 686px;
  white-space: normal !important;

  @media (max-width: 767px) {
    width: 100%;
  }
`;

export const Button = styled.button`
  padding: 12px 78px;
  background: white;
  border-radius: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-primary);
  border: none;
`;
