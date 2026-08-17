import styled from "styled-components";
import { SearchIcon } from "../../../../global/Icons";
import Dropdown from "../../../../global/common/Dropdown";
import BaseCard from "../../../../global/common/BaseCard";
import Comment from "../../../../global/common/Comment";
import Input from "../../../../global/common/Input";
import { DealStatus } from "../../../../../types/global_types";

export const TabWrapper = styled.div`
  & > button {
    top: -50px;
    z-index: 10;
  }
`;
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

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

export const ContentWrapper = styled.div`
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 980px) {
    gap: 12px;
  }
`;

export const CommentWrapper = styled(BaseCard)<{ isOffer?: boolean }>`
  width: ${({ isOffer }: { isOffer?: boolean }) =>
    isOffer ? "95%" : "100%"} !important;
  position: relative !important;
  padding: 0 16px 16px 0 !important;
  margin-left: auto;
  &::before {
    position: absolute;
    content: "";
    background-image: url(/static/common/arrow.png);
    background-size: contain;
    background-repeat: no-repeat;
    width: 40px;
    height: 80px;
    left: -50px;
  }
  &.first::before {
    position: absolute;
    content: "";
    background-image: url(/static/common/arrow-first.png);
    background-size: contain;
    background-repeat: no-repeat;
    width: 40px;
    height: 80px;
    left: -50px;
  }

  @media (max-width: 850px) {
    padding: 0 12px 12px 0 !important;
  }
`;

export const CommentItem = styled(Comment)`
  & > div:last-child {
    display: none;
  }

  @media (max-width: 850px) {
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
  flex-wrap: wrap;

  @media (max-width: 1200px) {
    gap: 12px;
  }
  @media (max-width: 850px) {
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

  .emoji {
    font-size: 20px;
  }
  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
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

export const getColorByStatus = (status: DealStatus): string => {
  const colors = {
    waiting: "var(--color-warning)",
    started: "var(--color-info)",
    ended: "var(--color-primary)",
    blocked: "var(--color-danger)",
    "forced-termination": "var(--color-danger)",
  };

  return colors[status];
};

export const StatusWrapper = styled.div<{ status?: DealStatus }>`
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

    color: ${(props) => getColorByStatus(props.status || "waiting")};
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

  @media (max-width: 850px) {
    top: auto;
    bottom: 55px;
    left: 16px;
  }
  @media (max-width: 450px) {
    font-size: 12px;
    left: 12px;
  }
`;

export const MobileStatusWrapper = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;

  @media (min-width: 850px) {
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
  flex-wrap: wrap;

  @media (min-width: 850px) {
    display: none;
  }

  @media (max-width: 850px) {
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

  @media (min-width: 850px) {
    display: none;
  }
`;

export const BuyContactWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  gap: 10px;
  padding-bottom: 0;
  flex-wrap: wrap;

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
      cursor: pointer;
      transition: all 0.3s ease;
      &:hover {
        opacity: 0.8;
        background: var(--color-primary);
        color: var(--color-white);
      }
      &:active {
        opacity: 0.5;
        background: var(--color-primary);
        color: var(--color-white);
      }
    }

    .dislike {
      background: #f8f8f9;
    }

    .like {
      /* background: var(--color-primary);
        color: var(--color-white); */
    }
  }

  .error {
    color: var(--color-danger);
    font-size: 14px;
    font-weight: var(--font-weight-regular);
  }
`;

export const DealWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  height: fit-content;
`;

export const DealItemsList = styled.div`
  display: flex;
  flex-direction: column;

`;

export const OffersList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;



  .column {
    flex: 1 1 40%;
  }

  .details {
    flex: 1 1 28%;
  }

  .right-column {
    flex: 1 1 10%;
  }
`;

export const OffersButton = styled.button<{
  offerType?: "sell" | "buy";
  isOpen: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  position: relative;
  z-index: 1;
  cursor: pointer;
  padding: 10px;
  margin-bottom: 4px;
  transition: background 0.3s ease;
  color: var(--color-text-muted);

  &:hover {
    background: var(--input-hover);
  }

  svg {
    transition: transform 0.3s ease;
    transform: rotate(${(props) => (props.isOpen ? "180deg" : "0deg")});
  }

  @media (max-width: 640px) {
    font-size: 14px;
    padding: 8px 10px;
  }
`;

export const MobileDealsSlider = styled.div`
  width: 100%;

  .deals-swiper {
    padding: 5px 0;
    margin: 0 -10px;
    padding: 0 10px;
  }

  .swiper-slide {
    width: 300px;
    height: auto;
  }
`;
