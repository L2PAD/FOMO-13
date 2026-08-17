import styled from "styled-components";
import Typography from "../../global/common/Typography";
import { Button } from "../../global/common/Button";
import BaseCard from "../../global/common/BaseCard";

export const PageWrapper = styled.div`
  margin: 27px auto 0;
  width: 1250px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  gap: 32px;
  justify-content: space-between;
  width: 100%;
  margin-top: 16px;

  @media (max-width: 991px) {
    flex-direction: column;
    align-items: center;
  }
`;

export const ImageWrapper = styled.div`
  max-width: 540px;
  width: 100%;
  height: auto;

  img {
    width: 100%;
    height: auto;
  }

  @media (max-width: 991px) {
    width: 100%;
  }

  @media (min-width: 991px) {
    img {
      height: 450px;
    }
  }
`;

export const NFTDataWrapper = styled.div`
  width: 50%;

  @media (max-width: 991px) {
    width: 100%;
  }
`;

export const NFTNameWrapper = styled.div`
  align-items: center;
  margin-bottom: 10px;
`;

export const NFTName = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 32px;
  line-height: 39px;
  color: var(--color-text-primary);
`;

export const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
`;

export const ButtonsWrapper = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

export const BuyButton = styled(Button)`
  width: 50%;
  padding: 13px !important;
  font-weight: var(--font-weight-semibold) !important;
  font-size: 18px !important;
  line-height: 22px !important;
  color: var(--color-white) !important;

  &:hover {
    color: var(--color-primary) !important;
  }
`;

export const OrderButton = styled.button`
  background: rgba(4, 165, 132, 0.15);
  border-radius: 8px;
  padding: 13px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-primary);
  border: none;
  width: 50%;
  transition: 0.3s;

  &:hover {
    color: white;
    background: var(--color-primary);
  }
`;

export const ProgressCardWrapper = styled(BaseCard)`
  width: 100%;
  margin-bottom: 39px;
  padding: 30px;
  display: flex;
  gap: 40px;
`;

export const ProgressImageWrapper = styled.div`
  position: relative;

  svg {
    width: 160px;
    height: 160px;
  }

  img {
    width: 150px;
    height: 150px;
    border-radius: 100px;
    position: absolute;
    left: 5px;
    top: 5px;
  }
`;

export const ProgressDataWrapper = styled.div`
  div:last-child {
    margin-top: 10px;
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);

    span {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }
  }
  div:first-child {
    p {
      font-weight: var(--font-weight-regular);
      font-size: 16px;
      line-height: 19px;
      color: var(--color-text-muted);
    }
    span {
      font-weight: var(--font-weight-semibold);
      font-size: 18px;
      line-height: 21px;
      color: var(--color-primary);
    }
    h6 {
      font-weight: var(--font-weight-regular);
      font-size: 16px;
      line-height: 19px;
      color: var(--color-text-muted);

      i {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }
    }
  }
`;

export const OwnerDetailsWrapper = styled.div`
  margin-bottom: 32px;

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 20px;
    line-height: 24px;
    color: var(--color-text-muted);
    margin-bottom: 20px;
  }

  div {
    display: flex;
    align-items: center;
    gap: 6px;

    img {
      width: 20px;
      height: 20px;
      border-radius: 100px;
    }

    span {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
      color: var(--color-primary);
    }
  }
`;

export const RewardCardsWrapper = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 13px;
  overflow-x: auto;
`;

export const FiltersWrapper = styled.div`
  margin: 30px 0 40px;
`;
export const FilterBtn = styled.button`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-primary);
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.3s ease;
  &:hover {
    color: #027b63;
  }
  &:active {
    color: #025242;
  }
`;
export const FilterBtnSelected = styled.button`
  background: var(--color-primary);
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 16px;
  text-align: center;
  color: var(--color-white);
  cursor: pointer;
`;

export const TextWrapper = styled.div`
  margin: 30px 0;
  font-size: 18px;
  font-weight: var(--font-weight-regular);
`;
export const CardsRow = styled.div`
  display: flex;
  gap: 27px;
  @media (max-width: 820px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

export const TableWrapper = styled.div`
  margin-top: 30px;
`;
