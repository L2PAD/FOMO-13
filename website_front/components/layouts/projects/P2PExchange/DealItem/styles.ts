import styled from "styled-components";
import Typography from "../../../../global/common/Typography";
import { DealStatus, UserRiskStatus } from "../../../../../types/global_types";
import { getColorByStatus } from "../../OTC/DealsList/styles";

export const Wrapper = styled.div<{
  isOffer: boolean;
  isHaveOffers: boolean;
  type: "sell" | "buy";
}>`
  display: grid;
  grid-template-columns: 0.5fr 0.06fr 0.2fr 0.3fr;
  background: ${(props) =>
    props.type === "buy"
      ? "linear-gradient(90deg, #D9F1ED 0%, var(--color-white) 100%)"
      : "linear-gradient(90deg, #FDEAEB 0%, var(--color-white) 100%)"};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom-left-radius: ${({ isHaveOffers }) =>
    isHaveOffers ? "0px" : "8px"};
  border-bottom-right-radius: ${({ isHaveOffers }) =>
    isHaveOffers ? "0px" : "8px"};
  width: ${({ isOffer }: { isOffer: boolean }) =>
    isOffer ? "95%" : "100%"} !important;
  position: relative !important;
  margin-left: auto;
  padding: 20px;
  box-shadow: ${({ isHaveOffers }) =>
    isHaveOffers ? "2px 0px 8px 2px #00053014" : "2px 2px 8px 2px #00053014"};

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

  &.first {
    &.clickable {
      display: none;
    }
    &::before {
      position: absolute;
      content: "";
      background-image: url(/static/common/arrow-first.png);
      background-size: contain;
      background-repeat: no-repeat;
      width: 40px;
      height: 80px;
      left: -50px;
    }

    .clickable {
      position: absolute;
      width: 40px;
      height: 40px;
      left: -50px;
      top: 0;
      left: 0;
      cursor: pointer;
      background: transparent;
    }
  }

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    row-gap: 12px;
    padding: 16px;
  }
  @media (max-width: 560px) {
    padding: 14px;
  }
`;

export const DealColumn = styled.div`
  padding-right: 10px;
`;

export const DealInfo = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;

  @media (max-width: 560px) {
    gap: 6px;
  }
`;

export const DealName = styled.div`
  margin: 20px 0 8px;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 17.15px;
`;

export const DealActions = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: auto;
  padding-bottom: 35px;

  button {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 17.14px;

    &:hover {
      opacity: 0.8;
    }
  }

  @media (max-width: 850px) {
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 8px;
    padding-bottom: 20px;
    button {
      font-size: 12px;
    }
  }
`;

export const DealIconWrapper = styled.div`
  margin: auto 0px;

  @media (max-width: 850px) {
    height: 40px;

    img {
      transform: rotate(90deg) translate(-80px, -50%);
    }
  }
`;

export const DealDetails = styled.div`
  margin: auto 0px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  @media (max-width: 1100px) {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px 16px;
  }
  @media (max-width: 850px) {
    margin-top: 8px;
  }
`;

export const DealDetailsItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;

  span {
    font-size: 14px;
    color: var(--color-text-muted);
  }
  div {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }

  @media (max-width: 1100px) {
    width: calc(50% - 8px);
  }
  @media (max-width: 560px) {
    width: 100%;
    span,
    div {
      font-size: 13px;
    }
  }
`;

export const DealStatusWrapper = styled.div<{ status: DealStatus }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  span {
    color: ${({ status }) => getColorByStatus(status)};
  }
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 17.14px;
`;

export const DealRightColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-left: auto;

  @media (max-width: 1100px) {
    margin-left: 0;
  }
`;

export const DealRightHeader = styled.div`
  display: flex;
  justify-content: flex-end;

  @media (max-width: 1100px) {
    justify-content: flex-start;
    gap: 8px;
    margin-bottom: 6px;
  }
`;

export const DealButtons = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 4px;
  flex-wrap: wrap;

  button {
    min-width: 100px;
  }

  @media (max-width: 900px) {
    justify-content: flex-start;
  }
  @media (max-width: 560px) {
    gap: 6px;
    button {
      width: 100%;
      min-width: 0;
    }
  }
`;

export const CommentText = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  text-align: left;

  @media (max-width: 560px) {
    font-size: 13px;
  }
`;
export const StartDeal = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  & > span {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }
`;

export const StartOrReject = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`;

export const RejectButton = styled.button`
  padding: 6px;
  color: var(--color-danger);
  font-weight: var(--font-weight-medium);
  transition: all 0.3s;

  &:hover {
    opacity: 0.7;
  }

  &:active {
    opacity: 0.6;
  }
`;

export const DescriptionStatus = styled.div<{ isVisible: boolean }>`
  position: absolute;
  z-index: ${({ isVisible }) => (isVisible ? 10 : 1)};
  top: 25px;
  left: 0;

  @media (max-width: 640px) {
    position: fixed;
    top: auto;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 32px);
    max-width: 360px;
    z-index: ${({ isVisible }) => (isVisible ? 999 : 1)};
  }
`;

export const DealReviewMessage = styled.div`
  margin-top: 12px;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--color-danger);
`;

export const DealActionsWrapper = styled.div`
  @media (max-width: 560px) {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;

    button {
      width: 100%;
    }
  }
`;

export const DealRisk = styled.div`
  margin-right: 10px;
`;

export const getRiskColorByStatus = (status: UserRiskStatus): string => {
  const colors = {
    Default: "black",
    Medium: "var(--color-warning)",
    High: "var(--color-danger)",
    Low: "var(--color-primary)",
  };

  return colors[status];
};

export const RiskValue = styled.div<{ risk: UserRiskStatus }>`
  color: ${({ risk }) => getRiskColorByStatus(risk)};

  @media (max-width: 560px) {
    font-size: 13px;
  }
`;
