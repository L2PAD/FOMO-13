import styled from "styled-components";
import Typography from "../../../global/common/Typography";
import { SearchIcon } from "../../../global/Icons";
import Dropdown from "../../../global/common/Dropdown";
import BaseCard from "../../../global/common/BaseCard";
import Comment from "../../../global/common/Comment";
import Input from "../../../global/common/Input";
import Tabs from "../../../global/Tabs";

export const Subtitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
`;

export const Table = styled.div`
  min-width: 600px;
  overflow-x: auto;
`;

export const TabWrapper = styled.div`
  & > button {
    top: -50px;
    z-index: 10;

    @media (max-width: 880px) {
      top: -26px;
    }
  }

  .separator {
    background: #f8f8f9;
    width: 100%;
    height: 1px;
    margin: 15px 0;
    min-width: 700px;
  }

  h2 p {
    font-weight: var(--font-weight-regular);
    margin-top: 5px;
  }

  .table {
    display: flex;
    justify-content: space-between;
    min-width: 700px;

    p {
      display: flex;
      align-items: center;
    }
  }
`;
export const SearchWrapper = styled.div`
  margin-top: 18px;
  display: flex;
  gap: 5%;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    margin-top: 20px;
    gap: 3%;
  }

  @media (max-width: 480px) {
    margin-top: 12px;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
`;
export const SearchInput = styled(Input)`
  width: 100%;

  &.crypto-market-search input{
    width: 300px;
    height: 40px;
    font-size: 14px; 
    &::placeholder {
      font-size: 14px; 
    }
      
    @media (max-width: 880px) {
      width: 100%;
    }
  }

  input {
    padding: 8px 12px 8px 36px;

    transition: all 0.3s ease;

    &:hover {
      background: var(--input-hover);
    }
    &:focus {
      background: var(--input-active);
    }
  }
`;
export const SearchIconStyle = styled(SearchIcon)`
  position: absolute;
  left: 10px;
  top: 7px;

  path {
    fill: var(--main-gray);
  }
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

export const FlexItemWrapper = styled.div`
  display: flex;
  gap: 40px;
  align-items: center;
  font-size: 18px;
  margin: 5px 100px;

  @media (max-width: 610px) {
    margin: 5px 0;
  }

  @media (max-width: 440px) {
    font-size: 16px;
    gap: 10px;
  }

  div {
    display: flex;
    gap: 15px;
    align-items: center;
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const CommentWrapper = styled(BaseCard)`
  width: 100% !important;
  position: relative !important;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const CommentItem = styled(Comment)`
  & > div:last-child {
    display: none;
  }

  @media (max-width: 880px) {
    & > div:first-child {
      margin-bottom: 50px;
    }
    & > div:nth-child(3) {
      margin-top: 30px;
    }
  }
`;

export const Buttons = styled(Tabs)`
  border-bottom: 0;
  gap: 10px;
  padding: 10px 0;

  div {
    border-bottom: 0;
    background: var(--color-text-muted)0d;
    border-radius: 8px;

    &.active {
      background: var(--color-primary)1a;
      color: var(--color-primary);
    }
  }
`;

export const ActionsWrapper = styled.div`
  z-index: 2;
  display: flex;
  gap: 24px;
  align-items: center;

  @media (max-width: 880px) {
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
  height: 35px;
  width: 35px;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;

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

  @media (max-width: 880px) {
    top: auto;
    bottom: 55px;
    left: 16px;
  }
`;

export const MobileStatusWrapper = styled.div`
  top: 16px;
  right: 16px;
  z-index: 2;

  @media (min-width: 880px) {
    display: none;
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

export const MobileDataWrapper = styled.div`
  z-index: 2;
  display: flex;
  align-items: center;

  div {
    width: 100%;
  }

  @media (min-width: 880px) {
    display: none;
  }

  @media (max-width: 880px) {
    width: 100%;
  }

  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 16px;

    div {
      width: fit-content;
    }

    div:first-child {
      width: 100%;
    }
  }
`;

export const MobileActionsWrapper = styled.div`
  bottom: 16px;
  right: 16px;
  z-index: 2;
  display: flex;
  gap: 16px;
  align-items: center;
  width: 100%;
  justify-content: space-between;

  @media (min-width: 880px) {
    display: none;
  }

  @media (max-width: 480px) {
    gap: 8px;
  }
`;

export const BuyContactWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 0;

  .buttons {
    display: flex;

    .error {
      color: var(--color-danger);
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
    }
  }

  .likes {
    display: flex;
    gap: 5px;
    font-weight: var(--font-weight-semibold);
    align-items: center;

    .like,
    .dislike {
      padding: 3px 10px;
      border-radius: 99px;
      display: flex;
      gap: 5px;
      align-items: center;
    }

    .dislike {
      background: #f8f8f9;
    }

    .like {
      background: var(--color-primary);
      color: var(--color-white);
    }
  }

  .error {
    position: relative;
    color: var(--color-danger);
    font-size: 14px;
    font-weight: var(--font-weight-regular);
  }

  @media (max-width: 880px) {
    flex-direction: column;
    gap: 16px;

    .likes {
      flex-direction: row;
      gap: 8px;
      align-items: flex-start;
    }

    .likes.full {
      width: 100%;
    }

    .buttons {
      width: 100%;
      gap: 16px;
      flex-direction: row;
      align-items: flex-start;
    }
  }

  @media (max-width: 480px) {
    .likes {
      flex-wrap: wrap;

      p {
        width: 100%;
      }
    }

    .buttons {
      gap: 8px;
    }
  }
`;

export const HeaderSwitchWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
`;

export const SwitchButton = styled.button<{ active: boolean }>`
  border: none;
  padding: 8px 10px;
  border-radius: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: ${({ active }) => (active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)")};
  background: ${({ active }) => (active ? "rgba(0, 192, 153, 0.1)" : "var(--color-white)")};
`;
export const MobileSwapsSlider = styled.div`
  width: 100%;

  .swaps-swiper {
    padding: 5px 0;
    margin: 0 -10px;
    padding: 0 10px;
  }

  .swiper-slide {
    width: 300px;
    height: auto;
  }
`;
