import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
`;

export const Item = styled.div``;

export const UserRow = styled.div``;

export const TabCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 2px 2px 8px 2px #00053014;
  padding: 12px;
  border-radius: 8px;
  min-height: 72px;
`;

export const TabLogo = styled.img`
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
`;

export const TabContent = styled.div`
  min-width: 0;
  width: 100%;

  .name {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-primary);
  }

  .description {
    margin-top: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-primary);
  }

  .meta {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    line-height: 12px;
    color: var(--color-text-muted);
  }

  .dot {
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: var(--color-text-muted);
    flex-shrink: 0;
  }
`;
