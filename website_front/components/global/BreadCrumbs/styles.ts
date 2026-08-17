import styled from "styled-components";
import Link from "next/link";

export const Wrapper = styled.ul`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  max-width: 100%;
  gap: 4px;
  margin: 0;
  padding: 2px 0;
  list-style: none;
`;

export const ListItem = styled.li`
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 5px;
`;

export const LinkItem = styled(Link)<{ $active: boolean }>`
  display: block;
  max-width: ${({ $active }) => ($active ? "320px" : "180px")};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${({ $active }) => ($active ? 700 : 600)};
  font-size: 13.5px;
  line-height: 18px;
  color: ${({ $active }) => ($active ? "var(--color-text-primary)" : "var(--color-text-muted)")};

  &:hover {
    color: var(--color-text-primary);
  }

  @media (max-width: 768px) {
    max-width: ${({ $active }) => ($active ? "180px" : "120px")};
  }
`;

export const Arrow = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  color: #95a4b7;

  svg {
    width: 6px;
    height: 11px;
  }

  path {
    stroke: currentColor;
  }
`;
