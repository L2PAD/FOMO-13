import styled from "styled-components";

export const BreadcrumbsWrapper = styled.div`
  display: flex;
  gap: 33px;
  padding-right: 50px;

  @media (max-width: 768px) {
    margin-left: 16px;
    padding-right: 0;
    flex-wrap: wrap;
    gap: 16px;
    row-gap: 8px;
  }
`;


export const Crumb = styled.span<{ active?: boolean }>`
  position: relative;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: ${({ active }: { active?: boolean }) =>
    active ? "var(--color-text-primary)" : "var(--color-text-muted)"};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    color: ${({ active }: { active?: boolean }) =>
    active ? "var(--color-text-primary)" : "rgba(7, 11, 53, 0.8)"};
  }
  &:active {
    color: ${({ active }: { active?: boolean }) =>
    active ? "var(--color-text-primary)" : "rgba(7, 11, 53, 0.4)"};
  }

  @media (max-width: 1024px) {
    font-size: 12px;
    line-height: 14px;
  }

  & .update-marker {
    background: var(--color-danger);
    width: 8px;
    height: 8px;
    border-radius: 50px;
  }
`;