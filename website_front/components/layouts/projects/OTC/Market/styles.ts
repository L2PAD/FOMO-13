import styled from "styled-components";
import Input from "../../../../global/common/Input";
import { SearchIcon } from "../../../../global/Icons";
import Dropdown from "../../../../global/common/Dropdown";
import BaseCard from "../../../../global/common/BaseCard";
import Comment from "../../../../global/common/Comment";

export const SearchWrapper = styled.div`
  margin-top: 24px;
`;
export const SearchInput = styled(Input)`
  width: 100% !important;

  input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    &::placeholder {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 19px;
      color: rgba(115, 128, 148, 0.5);
    }
  }
`;
export const SearchIconStyle = styled(SearchIcon)`
  position: absolute;
  left: 10px;
  top: 5px;
`;
export const DropdownWrapper = styled(Dropdown)`
  border: none !important;
`;

export const HeaderWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ContentWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const CommentWrapper = styled(BaseCard)`
  width: 100% !important;
  position: relative !important;
  padding: 0 16px 16px 0 !important;
`;

export const CommentItem = styled(Comment)`
  & > div:last-child {
    display: none;
  }

  @media (max-width: 767px) {
    & > div:first-child {
      margin-bottom: 50px;
    }
    & > div:nth-child(3) {
      margin-top: 30px;
    }
  }
`;

export const ActionsWrapper = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  display: flex;
  gap: 24px;
  align-items: center;

  @media (max-width: 767px) {
    display: none;
  }
`;

export const DefaultActionWrapper = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-primary);
    display: flex;
    gap: 8px;
  }
`;

export const RatingWrapper = styled.i`
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 16px;
    margin-top: -3px;
  }
`;

export const StatusWrapper = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-primary);
  }
`;

export const BlockButton = styled.button`
  border: none;
  background: none;
  padding: 8px 16px;
  background: rgba(0, 192, 153, 0.1);
  border-radius: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-primary);
`;

export const PinButton = styled.button`
  height: 20px;
  width: 20px;
  background: none;
  border: none;

  svg {
    width: 20px;
  }
`;

export const AlertText = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-danger);
  position: absolute;
  top: calc(100% - 45px);
  left: 160px;

  @media (max-width: 767px) {
    top: auto;
    bottom: 55px;
    left: 16px;
  }
`;

export const MobileStatusWrapper = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;

  @media (min-width: 767px) {
    display: none;
  }
`;

export const MobileDataWrapper = styled.div`
  position: absolute;
  top: 56px;
  left: 16px;
  z-index: 2;
  display: flex;
  gap: 24px;
  align-items: center;

  @media (min-width: 767px) {
    display: none;
  }
`;

export const MobileActionsWrapper = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 2;
  display: flex;
  gap: 24px;
  align-items: center;

  @media (min-width: 767px) {
    display: none;
  }
`;

export const ShareWrapper = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-primary);
  border: none;
  background: none;
  transition: opacity 0.3s ease;

  &:hover{
    opacity: 0.5;
  }

  &:active{
    opacity: 0.4;
  }
`;

export const PaperclipWrapper = styled.div`
  display: flex;
  cursor: pointer;
  transition: opacity 0.3s ease;

  &:hover{
    opacity: 0.6;
  }

  &:active{
    opacity: 0.5;
  }
` 