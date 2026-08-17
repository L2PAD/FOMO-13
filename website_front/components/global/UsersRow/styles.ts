import styled from "styled-components";

export const RowWrapper = styled.div`
  display: flex;
`;

export const AvatarItem = styled.div`
  &:not(:first-child) {
    margin-left: -11px;
  }
`;

export const UsersNumber = styled.div<{ $isClickable?: boolean }>`
  background: #e9f8f8;
  border: 2px solid var(--color-white);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 11px;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-10px);
  z-index: 10;
  cursor: ${({ $isClickable }) => ($isClickable ? "pointer" : "default")};
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  ${({ $isClickable }) =>
    $isClickable
      ? `
        &:hover {
          background: var(--color-primary);
          color: var(--color-white);
          box-shadow: 0 4px 10px rgba(4, 165, 132, 0.22);
          border-color: #d9f4ee;
        }
      `
      : ""}

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;
