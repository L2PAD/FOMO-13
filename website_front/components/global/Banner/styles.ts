import styled from "styled-components";
import Typography from "../common/Typography";

export const BannerWrapper = styled.div`
  width: 100%;
  background: #05c9a10d;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 32px;
  gap: 5px;

  @media (max-width: 1024px) {
    padding: 4px 16px;
  }
`;
export const Title = styled(Typography)`
  color: var(--color-primary);
  font-size: 16px;
  font-weight: var(--font-weight-semibold);

  @media (max-width: 1024px) {
    font-size: 12px;
  }

  @media (max-width: 524px) {
    display: none;
  }
`;

export const Text = styled(Typography)`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);

  @media (max-width: 1024px) {
    font-size: 12px;
  }

  span {
    font-weight: var(--font-weight-regular);
  }
`;

export const ButtonsWrapper = styled.div`
  display: flex;
  cursor: pointer;
  gap: 8px;
  align-items: center;

  a {
    color: var(--color-primary);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    border-radius: 18px;
    border: 1px solid var(--color-primary);
    padding: 3px 16px;
    white-space: nowrap;
  }
`;

export const Button = styled.div`
  color: var(--color-primary);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  border-radius: 18px;
  border: 1px solid var(--color-primary);
  padding: 3px 16px;
  white-space: nowrap;

  @media (max-width: 1024px) {
    font-size: 11px;
  }
`;
