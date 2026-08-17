import React from "react";
import * as S from "../styles";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { Button } from "../../../../../global/common/Button";
import { Check, Copy, CreditCard } from "lucide-react";
import FundsReservedIcon from "../../../../../global/Icons/Deals/FundsReservedIcon";
import { getDealTicker } from "./SellStep";
import { formatCurrency } from "../helpers";
import { MakePaymentSellerReservedProps } from "./MakePayment.types";
import { formatTime } from "../helpers";

const MakePaymentSellerReservedSection: React.FC<MakePaymentSellerReservedProps> = ({
  deal,
  timeLeft,
  userBalance,
  isChatExpanded,
  setIsChatExpanded,
  onCopy,
  onAppeal,
  onRefresh,
  onReturnFunds,
  isReturningFunds,
}) => {
  const REFRESH_COOLDOWN_MS = 60_000;
  const lastRefreshAtRef = React.useRef(0);
  const unlockTimerRef = React.useRef<number | null>(null);
  const [isRefreshDisabled, setIsRefreshDisabled] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (unlockTimerRef.current !== null) {
        window.clearTimeout(unlockTimerRef.current);
      }
    };
  }, []);

  const handleRefresh = React.useCallback(() => {
    const currentTime = Date.now();
    if (currentTime - lastRefreshAtRef.current < REFRESH_COOLDOWN_MS) {
      return;
    }

    lastRefreshAtRef.current = currentTime;
    setIsRefreshDisabled(true);
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
    }
    unlockTimerRef.current = window.setTimeout(() => {
      setIsRefreshDisabled(false);
    }, REFRESH_COOLDOWN_MS);
    onRefresh();
  }, [onRefresh, REFRESH_COOLDOWN_MS]);

  const shouldShowReturnButton = (!!deal.p2pSaleTimeEnd && timeLeft <= 0) || !!deal.isReturnFunds;

  return (
    <S.StepContent>
      <S.StatusStateWrapper>
        <S.StatusStateIcon variant="reserved">
          <div className="icon-inner">
            <Check />
          </div>
        </S.StatusStateIcon>

        <S.StatusStateTitle variant="reserved">Reserved</S.StatusStateTitle>

        <S.StatusStateMeta>
          <div className="expires-label">Expires in:</div>
          <div className="expires-time">{formatTime(timeLeft)}</div>
        </S.StatusStateMeta>

        <S.ChatButton onClick={() => setIsChatExpanded(!isChatExpanded)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4.5 4.5H9.3M4.5 7.7H7.3M13.3 6.9C13.3 7.82002 13.1059 8.69469 12.7563 9.4853L13.3012 13.2994L10.0326 12.4822C9.10663 13.003 8.038 13.3 6.9 13.3C3.36538 13.3 0.5 10.4346 0.5 6.9C0.5 3.36538 3.36538 0.5 6.9 0.5C10.4346 0.5 13.3 3.36538 13.3 6.9Z"
              stroke="#05A584"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isChatExpanded ? "Hide" : "Open"} chat
        </S.ChatButton>

        <S.StatusStateImage>
          <FundsReservedIcon />
        </S.StatusStateImage>

        <S.StatusStateDescription>
          <strong>
            {clarifyAmount(deal.amount)} {getDealTicker(deal.ticker)}
          </strong>{" "}
          has been temporarily moved from your balance to FOMO Escrow.
        </S.StatusStateDescription>
        <div className="additional-info">
          <S.StatusStateBalance>
            <div className="balance-left">
              <div className="balance-label">Your Balance</div>
            </div>

            <div className="balance-icon">
              <div className="balance-amount">
                {clarifyAmount(userBalance)} {getDealTicker(deal.ticker)}
              </div>
              <Button
                variant="outlined"
                onClick={() => window.open('https://www.fomo.cx/utility?action=withdraw', '_blank', 'noopener,noreferrer')}
              >
                <CreditCard />
              </Button>
            </div>
          </S.StatusStateBalance>

          <S.DetailsList className="details-list">
            <S.DetailRow>
              <S.DetailLabel>Listing ID</S.DetailLabel>
              <S.DetailValue>
                #{deal.dealId || deal._id}
                <Copy size={16} onClick={() => onCopy(String(deal.dealId || deal._id), "Listing ID")} />
              </S.DetailValue>
            </S.DetailRow>
            <S.DetailRow>
              <S.DetailLabel>Amount Locked</S.DetailLabel>
              <S.DetailValue>
                {clarifyAmount(deal.amount)} {getDealTicker(deal.ticker)}
              </S.DetailValue>
            </S.DetailRow>
            <S.DetailRow>
              <S.DetailLabel>Listing Price</S.DetailLabel>
              <S.DetailValue>
                {clarifyAmount(deal.price)} {formatCurrency(deal.currency)}
              </S.DetailValue>
            </S.DetailRow>
            <S.DetailRow>
              <S.DetailLabel>Status</S.DetailLabel>
              <S.DetailValue>Active - waiting for buyer payment</S.DetailValue>
            </S.DetailRow>
          </S.DetailsList>

          <S.StatusStateInfo>
            Funds are held in FOMO Escrow and cannot be withdrawn until the transaction is completed or canceled.
          </S.StatusStateInfo>

          <S.ButtonsRow>
            <Button variant="secondary" onClick={onAppeal}>
              Appeal
            </Button>
            {shouldShowReturnButton ?
              <Button variant="primary" onClick={onReturnFunds} disabled={isReturningFunds || !!deal.isReturnFunds}>
                {deal.isReturnFunds ? "Return Requested" : "Return"}
              </Button>
              :
              <Button variant="primary" onClick={handleRefresh} disabled={isRefreshDisabled}>
                Refresh
              </Button>
            }
          </S.ButtonsRow>
        </div>
      </S.StatusStateWrapper>
    </S.StepContent>
  );
};

export default MakePaymentSellerReservedSection;
