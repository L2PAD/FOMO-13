import styled from "styled-components";

export const FilterBarWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 40px;
  margin-bottom: 20px;
`;

export const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const RightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
  width: fit-content;
  max-width: 100%;
`;

export const TypeChip = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 32px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid ${({ active }) => (active ? "#e9f8f8" : "#f0f2f5")};
  background: ${({ active }) => (active ? "#f5fbfd" : "var(--color-white)")};
  cursor: pointer;
  white-space: nowrap;
  transition:
    border-color 0.15s,
    background 0.15s;

  &:hover {
    border-color: #e9f8f8;
    background: #f5fbfd;
  }
`;

export const ChipLabel = styled.span<{ active?: boolean }>`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: ${({ active }) => (active ? "var(--color-primary)" : "var(--color-text-primary)")};
`;

export const ChipCount = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
`;

export const StarChip = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 36px;
  min-width: 40px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid ${({ active }) => (active ? "#e9f8f8" : "#f0f2f5")};
  background: ${({ active }) => (active ? "#f5fbfd" : "var(--color-white)")};
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;

  &:hover {
    border-color: #e9f8f8;
    background: #f5fbfd;
  }

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

export const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  min-height: 32px;
  max-height: 32px;
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: #f9f9f9;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.3s ease;
  color: var(--color-text-primary);

  &:hover {
    background: var(--input-hover);
  }

  &:active {
    background: var(--input-active);
  }

  span {
    font-family: "Gilroy", sans-serif;
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    line-height: 19px;
    color: var(--color-text-primary);
  }
`;

export const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 38px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #f0f2f5;
  background: var(--color-white);
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--color-border);
  }
`;

export const ViewToggleWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const ViewToggleButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 6px 10px;
  height: 32px;
  border: none;
  background: ${({ active }) => (active ? "#f5fbfd" : "transparent")};
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f5fbfd;
  }
`;

export const DropdownWrapper = styled.div`
  width: 140px;
  flex-shrink: 0;

  button {
    height: 32px;
    min-height: 32px;
    max-height: 32px;
    padding: 6px 8px;
    font-size: 14px;
    border-radius: 8px;
  }
`;
