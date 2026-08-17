import styled from "styled-components";
import BaseCard from "../../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  padding: 0 !important;
  width: 100% !important;
  max-width: 333px;
`;

export const Header = styled.div`
  border-radius: 8px 8px 0 0;
  padding: 12px 16px;
  border-bottom: 2px solid #f8f8f9;

  h3 {
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: 10px;
  }

  div {
    display: flex;
    gap: 5px;
    font-size: 14px;
    align-items: center;
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

  b {
    font-weight: var(--font-weight-regular);
    color: var(--color-text-muted);
  }

  p {
    font-size: 14px;
    color: var(--color-text-primary);
  }
`;
