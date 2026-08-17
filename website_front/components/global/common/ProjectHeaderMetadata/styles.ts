import styled from "styled-components";
import { mainGlobalDark } from "../../../../styles/mainGlobalDark";

export const Fields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;
  margin-top: 18px;

  @media (max-width: 420px) {
    gap: 8px;
  }
`;

const Field = styled.div`
  position: relative;
  display: flex;
  min-width: 0;
  max-width: 100%;
  flex-direction: column;
  gap: 8px;
`;

export const SmartContractField = styled(Field)``;
export const CategoryField = styled(Field)``;

export const Title = styled.div`
  min-width: 0;
  min-height: 16px;
  color: ${mainGlobalDark.textMuted};
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const chipStyles = `
  display: inline-flex;
  width: 100%;
  min-width: 0;
  min-height: 34px;
  height: 34px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid ${mainGlobalDark.border};
  border-radius: 8px;
  background: ${mainGlobalDark.backgroundHover};
  color: ${mainGlobalDark.white};
  box-sizing: border-box;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
`;

export const SmartContractChip = styled.button`
  ${chipStyles}
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;

  &:hover,
  &:focus-visible {
    border-color: rgba(0, 221, 115, 0.28);
    background: ${mainGlobalDark.background};
    outline: none;
  }

  @media (max-width: 480px) {
    min-height: 32px;
    height: 32px;
    padding: 6px 8px;
    font-size: 13px;
  }
`;

export const CategoryChip = styled.div`
  ${chipStyles}

  &.has-hidden {
    overflow: visible;
  }

  @media (max-width: 480px) {
    min-height: 32px;
    height: 32px;
    padding: 6px 8px;
    font-size: 13px;
  }
`;

export const CategoryMain = styled.span`
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  align-items: center;
  gap: 6px;
  overflow: hidden;

  ${CategoryChip}.has-hidden & {
    max-width: calc(100% - 34px);
  }
`;

export const CategoryIcon = styled.span`
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  align-items: center;
  justify-content: center;
  color: ${mainGlobalDark.textMuted};

  svg {
    display: block;
    width: 16px;
    height: 16px;
  }
`;

export const CategoryText = styled.span`
  display: inline-block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const HiddenCategoryPopover = styled.span`
  position: relative;
  z-index: 30;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
`;

export const HiddenCategoryCount = styled.span`
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${mainGlobalDark.positive};
  color: ${mainGlobalDark.white};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  cursor: default;
  box-shadow: 0 8px 18px rgba(0, 221, 115, 0.18);

  @media (max-width: 480px) {
    width: 24px;
    height: 24px;
    font-size: 11px;
  }
`;

export const HiddenCategoryList = styled.span`
  position: absolute;
  top: calc(100% + 9px);
  right: 0;
  z-index: 40;
  display: flex;
  min-width: 176px;
  max-width: min(260px, calc(100vw - 32px));
  max-height: 240px;
  flex-direction: column;
  gap: 7px;
  padding: 10px;
  border: 1px solid ${mainGlobalDark.border};
  border-radius: 10px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.26);
  overflow: auto;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(6px);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    visibility 0.18s ease;

  ${HiddenCategoryPopover}:hover &,
  ${HiddenCategoryPopover}:focus-within & {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
  }
`;

export const HiddenCategoryItem = styled.span`
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  color: ${mainGlobalDark.text};
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  line-height: 17px;
  white-space: nowrap;

  svg {
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
    color: ${mainGlobalDark.textMuted};
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const ContractsDropdown = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 35;
  display: none;
  width: min(320px, calc(100vw - 32px));
  max-width: 100%;
  max-height: 240px;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid ${mainGlobalDark.border};
  border-radius: 12px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.26);
  overflow: auto;

  ${SmartContractField}:hover &,
  ${SmartContractField}.is-open & {
    display: flex;
  }
`;

export const ContractItem = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
  padding: 8px;
  border-radius: 9px;
  background: ${mainGlobalDark.backgroundHover};
`;

export const ContractInfo = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  color: ${mainGlobalDark.text};
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  line-height: 17px;

  img {
    width: 24px;
    height: 24px;
    flex: 0 0 24px;
    border-radius: 50%;
    object-fit: cover;
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const ContractCopyButton = styled.button`
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid ${mainGlobalDark.border};
  border-radius: 8px;
  background: ${mainGlobalDark.background};
  color: ${mainGlobalDark.white};
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgba(0, 221, 115, 0.28);
    outline: none;
  }

  svg {
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
  }
`;

export const ContractAddress = styled.span`
  min-width: 0;
  overflow: hidden;
  color: ${mainGlobalDark.white};
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
