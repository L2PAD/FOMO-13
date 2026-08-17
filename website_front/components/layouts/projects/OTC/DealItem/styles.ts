import styled from "styled-components";
import { DealStatus, UserRiskStatus } from "../../../../../types/global_types";
import { getColorByStatus } from "../DealsList/styles";

export const Wrapper = styled.div<{
  isOffer: boolean;
  isHaveOffers: boolean;
  type: "sell" | "buy";
}>`
  height: 245px;
  background: ${(props) =>
    props.type === "buy"
      ? "linear-gradient(90deg, #D9F1ED 0%, var(--color-white) 100%)"
      : "linear-gradient(90deg, #FDEAEB 0%, var(--color-white) 100%)"};
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-bottom-left-radius: ${({ isHaveOffers }) =>
    isHaveOffers ? "0px" : "12px"};
  border-bottom-right-radius: ${({ isHaveOffers }) =>
    isHaveOffers ? "0px" : "12px"};
  width: ${({ isOffer }: { isOffer: boolean }) =>
    isOffer ? "95%" : "100%"} !important;
  position: relative !important;
  margin-left: auto;
  padding: 20px;
  box-shadow: 2px 2px 8px 2px #00053014;
  display: flex;
  gap: 20px;
  flex-direction: row;
  transition: box-shadow 0.3s ease;

  &:hover{
    box-shadow: 2px 2px 8px 2px #0005302c;
  }

  &.first {
    margin-top: 0px;

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
      top: 0px;
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

  min-width: 1100px;

  @media (max-width: 767px) {
    min-width: 0;
    width: 100% !important;
    height: auto;
    max-height: none;
    border-radius: 12px;
    border: none;
    padding: 12px;
    background: ${(props) =>
    props.type === "buy"
      ? "linear-gradient(120deg, #e8f9f5 0%, #f7fbfb 45%, var(--color-white) 100%)"
      : "linear-gradient(120deg, #fdf0f2 0%, #faf7f8 45%, var(--color-white) 100%)"};
    box-shadow: 2px 2px 8px 2px #00053014;

    .desktop-only {
      display: none !important;
    }
  }

`;

export const DealColumn = styled.div`
  max-width: 45%;
  display: flex;
  width: 100%;
  flex-direction: column;
  flex: 1 1 40%;
  position: relative;

  @media (max-width: 767px) {
    max-width: 100%;
    flex: 1 1 auto;
  }
`;

export const DealInfo = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;

  &.details {
    gap: 20px;
    margin-top: 20px;

    .info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
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

  button {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 17.14px;
    transition: opacity 0.3s ease;
    &:hover {
      opacity: 0.6;
    }

    &:active {
      opacity: 0.4;
    }
  }
`;

export const DealIconWrapper = styled.div`
  position: relative;
  height: 100%;
  width: 38px;

  img {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  &::before {
    content: "";
    position: absolute;
    width: 1px;
    height: calc(100% / 2 - 30px);
    background: var(--color-text-soft);
    left: 50%;
    top: 0;
    transform: translateX(-50%);
  }
  &::after {
    content: "";
    position: absolute;
    width: 1px;
    height: calc(100% / 2 - 30px);
    background: var(--color-text-soft);
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
  }

  @media (max-width: 767px) {
    display: none;
  }
`;

export const DealDetails = styled.div`
  margin: auto 0px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  flex: 1 1 calc(30% - 40px);
`;

export const DealDetailsItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 18px;

  span {
    font-size: 14px;
    color: var(--color-text-muted);
  }
  div {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color:var(--main-black);
  }

  .payment-methods {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .payment-icon {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-white);

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .tooltip-button {
    position: relative;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
  }

  .tooltip-text {
    position: absolute;
    top: 20px;
    left: 0;
    background: var(--color-white);
    border: 1px solid #e4e7ec;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    padding: 8px;
    display: none;
    flex-direction: column;
    gap: 6px;
    min-width: 180px;
    z-index: 10;
  }

  .tooltip-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .tooltip-button:hover .tooltip-text {
    display: flex;
  }

  @media (max-width: 767px) {
    height: auto;
    min-height: 18px;
    align-items: flex-start;
    flex-wrap: wrap;
  }
`;

export const DealStatusWrapper = styled.div<{ status: DealStatus }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  span {
    color: ${({ status }) => getColorByStatus(status)} !important;
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
  flex: 1 1 10%;

  .deal-id {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: #333;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    width: fit-content;
    margin-left: auto;
  }

  @media (max-width: 767px) {
    width: 100%;
    margin-left: 0;
    flex: 1 1 auto;
    justify-content: flex-start;

    .deal-id {
      margin-left: 0;
    }
  }
`;

export const DealRealAssetWrapper = styled.div`
  position: relative;

  & .real-asset{
    min-width: 220px;
    left: -200px;
    padding: 8px;
    div{
      font-size: 12px;
      line-height: 150%;
      color: var(--main-gray);
    }
  }

  & .chat-btn{
    transition: opacity 0.3s ease;

    &:hover{
      opacity: 0.6;
    }

    &:active{
      opacity: 0.4;
    }

    svg{
      width:18px;
      height:18px;
    }
  }
`

export const DealRightHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 3.5px;

  &.details {
    position: absolute;
    right: 0;
    top: 0;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 767px) {
    &.details {
      position: absolute;
      top: 10px;
      right: 0;
      justify-content: flex-end;
      padding: 0;
      margin-top: 0;
    }
  }
`;

export const DealHeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
`

export const DealButtons = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 4px;
  flex-wrap: wrap;
  gap: 8px;

  button {
    min-width: 100px;
  }
`;

export const CommentText = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  text-align: left;
  flex: 1;
  min-height: 0px;
  padding-bottom: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

export const StartDeal = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  & > span {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }

  @media (max-width: 767px) {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;

    & > span {
      font-size: 12px;
    }

    button {
      min-height: 36px;
      padding: 6px 12px;
      font-size: 12px;
    }
  }
`;

export const StartOrReject = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;

  .start-deal-mobile {
    display: none;
  }

  @media (max-width: 767px) {
    width: 100%;
    align-items: stretch;
    gap: 6px;

    .start-deal-desktop {
      display: none;
    }

    .start-deal-mobile {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      width: 100%;
      min-width: 0;
    }

    .start-deal-mobile .deal-with {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      flex: 1;

      @media (max-width: 375px) {
            position: relative;

      & .chat-btn{
        position: absolute;
        right: 0px;
        bottom: -10px;
      }
      }
    }

    .start-deal-mobile .deal-with > span {
      font-size: 12px;
      font-weight: var(--font-weight-semibold);
      color: var(--main-black);
      flex-shrink: 0;
    }

    .start-deal-mobile .mobile-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }

    .start-deal-mobile .mobile-actions button {
      min-height: 36px;
      padding: 6px 12px;
      font-size: 12px;
      min-width: 50px ;
    }

    .desktop-reject {
      display: none;
    }
  }
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

  &.main-reject {
    font-size: 16px;
    padding: 8px;
    background: #f9f9f9;
    border-radius: 8px;
  }

  @media (max-width: 767px) {
    font-size: 12px;
    padding: 4px 2px;
    text-align: right;
  }
`;

export const ConfirmButton = styled.button`
  padding: 6px;
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  transition: all 0.3s;

  &:hover {
    opacity: 0.7;
  }

  &:active {
    opacity: 0.6;
  }

  &.main-reject {
    font-size: 16px;
    padding: 8px;
    background: #f9f9f9;
    border-radius: 8px;
  }
`;

export const DescriptionStatus = styled.div<{ isVisible: boolean }>`
  position: absolute;
  z-index: ${({ isVisible }) => (isVisible ? 10 : 1)};
  top: 25px;
  left: 0;
`;

export const RealAsset = styled.div<{ isVisible: boolean }>`
  position: absolute;
  z-index: ${({ isVisible }) => (isVisible ? 10 : 1)};
  top: 35px;
  left: -120px;
`;

export const RiskDescriptionWrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  z-index: ${({ isVisible }) => (isVisible ? 10 : 1)};
  top: 25px;
  left: -90px;
  pointer-events: none;
  
  & .risk{
    min-width:270px;
    padding: 8px;
    div{
      font-size: 12px;
      line-height: 150%;
      color: var(--main-gray);
    }
  }
`;

export const ShareDescriptionWrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  z-index: ${({ isVisible }) => (isVisible ? 10 : 1)};
  top: 28px;
  left: -100px;
  pointer-events: none;
  
  & .risk{
    min-width:170px;
    padding: 8px;
    div{
      font-size: 12px;
      line-height: 150%;
      color: var(--main-gray);
    }
  }
`;

export const PinDescriptionWrapper = styled.div<{ isVisible: boolean }>`
  position: absolute;
  z-index: ${({ isVisible }) => (isVisible ? 10 : 1)};
  top: 28px;
  left: -100px;
  pointer-events: none;

  &.chat{
      left: -50px;
  }

  & .risk{
    min-width: 140px;
    padding: 8px;
    div{
      font-size: 12px;
      line-height: 150%;
      color: var(--main-gray);
      text-align: center;
    }
  }
    & .chat{
    min-width: 90px;
    padding: 8px;
    div{
      font-size: 12px;
      line-height: 150%;
      color: var(--main-gray);
      text-align: center;
    }
  }
`;

export const DealReviewMessage = styled.div`
  margin-top: 12px;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--color-danger);
`;

export const MobileFlipScene = styled.div`
  display: none;

  @media (max-width: 767px) {
    display: block;
    perspective: 1200px;
    width: 100%;
  }
`;

export const MobileFlipCard = styled.div<{ flipped: boolean }>`
  position: relative;
  width: 100%;
  height: auto;
  max-height: none;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
  transform: ${({ flipped }) => (flipped ? "rotateY(180deg)" : "rotateY(0deg)")};

  .mobile-front-sizer {
    visibility: hidden;
    pointer-events: none;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 767px) {
    transform-style: preserve-3d;
  }
`;

export const MobileFlipFace = styled.div<{ back?: boolean }>`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  backface-visibility: hidden;
  transform: ${({ back }) => (back ? "rotateY(180deg)" : "rotateY(0deg)")};
  border-radius: 10px;
  overflow: hidden;
`;

export const MobileTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

export const MobileUserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  .meta {
    min-width: 0;
  }

  .name {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.1;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wallet {
    margin-top: 6px;
    font-size: 12px;
    color: #91a0b8;
  }
`;

export const MobileActionsColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
`;

export const MobileIconsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  button {
    display: flex;
    align-items: center;
    justify-content: center;

  }
`;

export const MobileRiskRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-muted);

  .risk-value {
    font-weight: var(--font-weight-semibold);
  }

  .flags {
    display: flex;
    align-items: center;
    gap: 3px;
  }
`;

export const MobileDealTitle = styled.h3`
  margin: 10px 0 6px;
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
  color: var(--color-text-primary);
`;

export const MobileDescription = styled.div`
  margin: 0;
  color: #1d2644;
  font-size: 14px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const MobileDate = styled.div`
  margin-top: auto;
  text-align: right;
  font-size: 12px;
  color: #91a0b8;
`;

export const MobileFooter = styled.div`
  margin-top: auto;
  padding-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  .mobile-likes {
    display: flex;
    align-items: center;
    gap: 12px;

    button {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }
  }

  .mobile-main-button {
    min-width: 140px;
    padding:5px 0px;
    margin-left: auto;
  }

  .mobile-main-button button,
  .mobile-main-button .button,
  .mobile-main-button > div {
    min-width: 140px;
  }

  .mobile-main-button > div {
    position: static;
    right: auto;
    bottom: auto;
    width: auto;
    justify-content: flex-end;
  }
`;

export const MobileDetailsList = styled.div`
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
`;

export const MobileDetailsItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  span {
    font-size: 12px;
    color: var(--main-gray);
    flex: 0 0 auto;
  }

  b {
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    text-align: right;
  }
`;

export const MobileStatusValue = styled.b<{ color: string }>`
  color: ${({ color }) => color};
  display: inline-flex;
  align-items: center;
  gap: 5px;
`;

export const MobileCustomDealLabel = styled.div`
  margin-top: 6px;
  margin-left: auto;
  font-size: 12px;
  color: var(--main-green);
  background: var(--color-primary-soft);
  border-radius: 8px;
  padding: 6px 10px;
  width: fit-content;
`;

export const DealActionsWrapper = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: row;
  gap: 20px;
  align-items: center;
  width:270px;
  justify-content: flex-end;

  & .offer{
    &:hover{
      opacity: 0.7;
    }

    &:active{
      opacity: 0.5;
    }
  }

  .contact {
    font-weight: var(--font-weight-regular);
    border: 1px solid var(--color-primary);
    padding: 8px 16px;
    font-size: 12px;
    width: 100%;
    max-width: 120px;

    &:hover{
      opacity: 0.7;
    }

    &:active{
      opacity: 0.5;
    }
  }

  .buy {
    background: var(--color-primary);
    color: white;
    font-weight: var(--font-weight-semibold);
    padding: 8px 16px;
    font-size: 12px;
    width: 100%;
    max-width: 113px;

    &:hover{
      background: #038268ff;
    }

    &:active{
      background: #03755eff;
    }
  }

  @media (max-width: 850px) {
    right:0px;
    bottom:25px;
  }
`;

export const DealRisk = styled.div`
  position: relative;
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
  b{
    color: ${({ risk }) => getRiskColorByStatus(risk)};
  }
`;

export const DetailsCard = styled.div`
  padding: 32px 20px 20px 20px;
  box-shadow: 2px 2px 8px 2px #00053014;
  display: flex;
  gap: 20px;
  flex-direction: row;
  margin-top: -10px;
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  height: 340px;

  min-width: 1100px;

  @media (max-width: 767px) {
    min-width: 0;
    width: 100%;
    height: auto;
    padding: 12px;
    margin-top: -6px;
    gap: 12px;
    flex-direction: column;
    border-radius: 12px;
  }
`;

export const DetailsCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
`;

export const DetailsCardTitle = styled.h3`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  margin: 0;
  color: #333;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-muted);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #333;
  }
`;

export const DetailsCardContent = styled.div`
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
`;

export const DetailsSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const DetailsSectionTitle = styled.h4`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #333;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
`;

export const DetailsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const DetailsLabel = styled.span`
  font-size: 14px;
  color: var(--color-text-muted);
`;

export const DetailsValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #333;
`;

export const ViewDetailsButton = styled.button`
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #038a6b;
  }

  &:active {
    transform: translateY(1px);
  }
`;

export const DealHighlightWrapper = styled.div`
  position: relative;
  margin-top: 20px;
  
  #sponsored-deal {
    margin-top: 12px;
    position: relative;
    border-radius: 12px;
    padding: 16px; 
    border-top-right-radius: 0px;
    border: 1px solid var(--main-blue);
  }
  
  &:first-child {
    margin-top: 0px;
  }
  
  &.deal-highlighted {
    &::before {
      content: "";
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      pointer-events: none;
    }
    
    z-index: 9999;
    position: relative;
  }
`;

export const EmptyDetailsWrapper = styled.div`
  width: 100%;

  button{
    width: 100%;
  }
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  border-top-left-radius: 0px;
  border-top-right-radius: 0px;
    box-shadow: 2px 2px 8px 2px #00053014;
`

export const PromoteLabel = styled.div`

  height: 24px;
  display: flex;
  align-items: center;
  gap: 6px;

  svg{
    width:16px;
    height:16px;
  }

  & .promote-button{
    display: flex;
    align-items: center;
    gap: 2px;
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    color: var(--main-blue);
    transition: opacity 0.3s ease;

    &:hover{
      opacity: 0.7;
    }

    &:active{
      opacity: 0.5;
    }

    svg{
      margin-left: 5px;
      width: auto;
      height: auto;
    }
  }

  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  padding-top: 6px;
  padding-right: 20px;
  padding-bottom: 4px;
  padding-left: 20px;
  border-top-width: 1px;
  border-right-width: 1px;
  border-left-width: 1px;
  background: #f8feffff;
  border: 1px solid var(--main-blue);
  border-bottom: 0px;
`

export const PromoteWrapper = styled.div`
  position: absolute; 
  top: -24px;
  right: -1px;
`

export const PromoteDescription = styled.div`
  & .gray-description{
      position: absolute;
      right: 0px;
      top: 28px;    
      z-index: 1;
      min-width:220px;

    & .description-modal-text{
      font-size: 12px;

      span{
        font-weight: var(--font-weight-semibold);
      }
    }
  }
  `
