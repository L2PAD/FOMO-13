import styled from "styled-components";

export const CompareModalWrapper = styled.div`
  .dashed-line {
    width: 100%;
    height: 1px;
    border-bottom: 1px dashed var(--color-border);
    margin-bottom: 20px;
  }
`;

export const CompareContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const CompareColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  height: fit-content;

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

export const ColumnTitle = styled.h3`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;

  &.section-title {
    font-size: 16px;
    margin-bottom: 8px;
  }
`;

export const SearchBox = styled.div`
  position: relative;
  width: 100%;
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: #728094;
  }

  &:hover {
    background: var(--input-hover);
  }

  &:focus {
    background: var(--input-active);
    border-color: var(--color-primary);
  }
`;

export const SelectedEntity = styled.div`
  position: relative;
`;

export const EntityPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const RemoveButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #728094;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  svg {
    transition: all 0.2s ease;
  }

  &:hover {
    svg path {
      stroke: var(--color-text-primary);
    }
  }
`;

export const AudienceIntersection = styled.div`
  margin-top: 20px;
  padding: 24px;
  background: #f5fbfd;
  border-radius: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .estimated-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #728094;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid var(--color-text-soft);
  }

  .description {
    font-size: 14px;
    color: #728094;
    margin-bottom: 20px;
    margin-top: 0;
  }
`;

export const IntersectionRow = styled.div`
  margin-bottom: 20px;

  &:last-of-type {
    margin-bottom: 20px;
  }
`;

export const IntersectionLabel = styled.div`
  font-size: 14px;
  color: #728094;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .name {
    font-weight: var(--font-weight-semibold);
  }

  .percentage-large {
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;

export const IntersectionBar = styled.div<{
  percentage: number;
  color?: string;
}>`
  width: 100%;
  height: 8px;
  background: #e9f8f8;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  margin-bottom: 8px;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${({ percentage }) => percentage}%;
    background: ${({ color }) => color || "var(--color-primary)"};
    border-radius: 4px;
  }
`;

export const IntersectionCalculation = styled.div`
  font-size: 12px;
  color: #728094;
  margin-top: 8px;
`;
