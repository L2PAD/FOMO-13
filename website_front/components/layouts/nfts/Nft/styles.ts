import styled from "styled-components";

export const Wrapper = styled.div`
  width: 23.7%;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 2px 2px 8px 2px #00053014;

  @media (max-width: 1204px) {
    width: calc(33.33% - 14px);
  }
  @media (max-width: 992px) {
    width: calc(50% - 10px);
  }
  @media (max-width: 600px) {
    width: 100%;
  }

  & .nft-logo {
    width: 100%;
    height: 340px;
    object-fit: cover;

    @media (max-width: 992px) {
      height: 300px;
    }
    @media (max-width: 600px) {
      height: 260px;
    }
  }
`;

export const FavButtonWrapper = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1;

  @media (max-width: 600px) {
    top: 16px;
    left: 16px;
  }
`;

export const EpicLabel = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1;

  background: #f5fbfd;
  border-radius: 8px;
  padding: 4px 10px;

  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17.15px;
  letter-spacing: 0%;

  @media (max-width: 600px) {
    font-size: 13px;
    padding: 4px 8px;
    top: 16px;
    right: 16px;
  }

  &.Epic {
    color: #8a53ff;
  }
  &.Legendary {
    color: var(--color-warning);
  }
  &.Mythic {
    color: var(--color-danger);
  }
  &.Rare {
    color: #5085bd;
  }
`;

export const IdWrapper = styled.div`
  position: absolute;
  z-index: 1;
  left: 20px;
  top: 155px;

  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16.8px;
  letter-spacing: 0%;
  text-align: center;
  padding: 4px 10px;
  border-radius: 8px;
  background: #f5fbfd;
  color: var(--main-gray);

  @media (max-width: 992px) {
    top: 130px;
  }
  @media (max-width: 600px) {
    top: 110px;
    font-size: 13px;
  }
`;

export const InfoWrapper = styled.div`
  position: absolute;
  z-index: 1;
  left: 0px;
  bottom: 0px;
  height: 140px;
  width: 100%;
  background: #f5fbfd;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  @media (max-width: 600px) {
    height: 130px;
    padding: 16px;
  }

  & .project {
    display: flex;
    align-items: center;
    gap: 8px;

    & .info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      div {
        font-weight: var(--font-weight-semibold);
        font-size: 14px;
        line-height: 17px;
        color: var(--main-black);

        @media (max-width: 600px) {
          font-size: 13px;
        }
      }
      span {
        font-weight: var(--font-weight-regular);
        font-size: 14px;
        line-height: 16.8px;
        color: var(--main-gray);

        @media (max-width: 600px) {
          font-size: 13px;
        }
      }
    }
  }
`;

export const InfoHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

export const ViewsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16.8px;
  color: var(--main-gray);

  @media (max-width: 600px) {
    font-size: 13px;
  }
`;

export const InfoBottom = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;

  button {
    &:hover {
      opacity: 0.7;
    }
    &:active {
      opacity: 0.5;
    }
  }
`;

export const PriceInfo = styled.div`
  div {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19.6px;
    margin-bottom: 4px;

    @media (max-width: 600px) {
      font-size: 15px;
    }
  }

  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16.8px;
    letter-spacing: 0%;
    color: var(--main-gray);

    @media (max-width: 600px) {
      font-size: 13px;
    }
  }
`;
