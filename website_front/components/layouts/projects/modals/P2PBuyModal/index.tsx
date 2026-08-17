import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import * as S from "./styles";
import MainModal from "../../../../global/common/MainModal";
import { IDeal } from "../../../../../types/global_types";
import BuyStep from "./steps/BuyStep";
import MakePayment from "./steps/MakePayment";
import ReleasingStep from "./steps/ReleasingStep";
import AppealStep from "./steps/AppealStep";
import CompletedStep from "./steps/CompletedStep";
import SellStep from "./steps/SellStep";
import PaymentMethodModal from "../PaymentMethodModal";
import ChatSidebar from "./ChatSidebar";
import MinimizedBar from "./components/MinimizedBar";
import { Minimize2 } from "lucide-react";
import {
  clearStoredP2PPaymentDeadline,
  getRemainingP2PSaleTimeEndSeconds,
  formatTime,
} from "./helpers";
import { useDealPolling } from "./hooks/useDealPolling";
import { IBuyModalStep } from "./types";
import { getBackStep, getModalTitle, getSystemNotifications } from "./stateHelpers";

interface P2PBuyModalProps {
  initialStep: IBuyModalStep
  isVisible: boolean
  deal: IDeal | null
  onClose: () => void;
  refetchDeals?: () => void | Promise<void>;
  onReserveFunds?: () => void;
  onMarkPayment?: () => void;
  onSubmitFeedback?: (action: "like" | "dislike", text: string) => Promise<void>;
}

const P2PBuyModal: FC<P2PBuyModalProps> = ({ initialStep, isVisible, deal, onClose, refetchDeals, onReserveFunds, onMarkPayment, onSubmitFeedback }) => {
  const [step, setStep] = useState<IBuyModalStep>(initialStep || "buy");
  const [appealBackStep, setAppealBackStep] = useState<IBuyModalStep | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => getRemainingP2PSaleTimeEndSeconds(deal));
  const [releaseTimeLeft, setReleaseTimeLeft] = useState(() => getRemainingP2PSaleTimeEndSeconds(deal));
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const stepSyncKeyRef = useRef<string>("");
  const { deal: polledDeal, refreshDeal } = useDealPolling(deal, {
    isEnabled: isVisible,
    intervalMs: 10000,
    onBeforeFetch: refetchDeals,
  });
  const currentDeal = polledDeal || deal;
  const triggerDealRefresh = useCallback(async () => {
    await refreshDeal(true);
  }, [refreshDeal]);

  useEffect(() => {
    if (!isVisible) {
      stepSyncKeyRef.current = "";
      return;
    }

    const stepKey = `${deal?._id || "none"}:${initialStep || "buy"}`;
    if (stepSyncKeyRef.current === stepKey) return;
    stepSyncKeyRef.current = stepKey;

    setIsChatExpanded(false);
    setIsMinimized(false);
    setAppealBackStep(null);
    setStep(initialStep || "buy");
  }, [deal?._id, isVisible, initialStep]);

  const openAppeal = useCallback((fromStep: IBuyModalStep) => {
    setAppealBackStep(fromStep);
    setStep("appeal");
  }, []);

  const backBtnAction = () => {
    if (step === "appeal" && appealBackStep) {
      setStep(appealBackStep);
      setAppealBackStep(null);
      return;
    }

    setStep(getBackStep(step));
  };

  useEffect(() => {
    if (!currentDeal || !isVisible) return;

    if (currentDeal.status === "ended" && step !== "completed") {
      setStep("completed");
      return;
    }

    if (currentDeal.isAppeal && step !== "appeal" && step !== "completed") {
      setStep("appeal");
    }
  }, [currentDeal?._id, currentDeal?.status, currentDeal?.isAppeal, isVisible, step]);

  const handleClose = () => {
    setIsChatExpanded(false);
    if (step === "appeal") {
      backBtnAction();
      return;
    }
    if (step === "make-payment" || step === "releasing" || step === "completed") {
      setIsMinimized(true);
      return;
    }
    onClose();
    setTimeout(() => {
      setStep("buy");
    }, 200);
  };

  const handleCompleteClose = () => {
    setIsChatExpanded(false);
    setIsMinimized(false);
    setAppealBackStep(null);
    onClose();
    setTimeout(() => {
      setStep("buy");
    }, 200);
  };

  const handleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  const getMinimizedLabel = () => {
    switch (step) {
      case "sell":
        return "Sell";
      case "make-payment":
        return "Make Payment";
      case "releasing":
        return "Releasing";
      case "appeal":
        return "Appeal";
      case "completed":
        return "Completed";
      default:
        return "P2P Deal";
    }
  };

  const getMinimizedStatus = (): "pending" | "confirmed" | "rejected" | "cancelled" => {
    switch (step) {
      case "completed":
        return "confirmed";
      case "appeal":
        return "pending";
      case "releasing":
        return "pending";
      case "make-payment":
        return "pending";
      default:
        return "pending";
    }
  };

  const getMinimizedTimeLeft = () => {
    if (step === "make-payment") return timeLeft;
    if (step === "releasing") return releaseTimeLeft;
    return 0;
  };

  const minimizedTimeLeft = getMinimizedTimeLeft();
  const isTimerStep = step === "make-payment" || step === "releasing";
  const isTimerExpired = !!(isTimerStep && minimizedTimeLeft <= 0 && currentDeal?.isReservedFunds);
  const getMinimizedPendingText = () => {
    if (currentDeal?.isMakePayment) {
      return "Payment Marked";
    }

    if (currentDeal?.isReturnFunds) {
      return "Return Requested";
    }

    if (isTimerExpired) {
      return "Payment window expired";
    }

    if (currentDeal?.status === "started" && !currentDeal?.isReservedFunds) {
      return "Waiting for funds reservation";
    }

    return undefined;
  };

  const minimizedPendingText = getMinimizedPendingText();

  useEffect(() => {
    if (step === "buy" || step === "sell") {
      setIsMinimized(false);
    }
  }, [step]);

  useEffect(() => {
    if (!isVisible || step !== "make-payment") return;
    if (currentDeal?.isMakePayment) return;

    const updateTimeLeft = () => {
      setTimeLeft(getRemainingP2PSaleTimeEndSeconds(currentDeal));
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [
    isVisible,
    step,
    currentDeal?._id,
    currentDeal?.p2pSaleTimeEnd,
    currentDeal?.isMakePayment,
  ]);

  useEffect(() => {
    if (!isVisible || step !== "releasing") return;

    const updateReleaseTimeLeft = () => {
      setReleaseTimeLeft(getRemainingP2PSaleTimeEndSeconds(currentDeal));
    };

    updateReleaseTimeLeft();
    const timer = setInterval(updateReleaseTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [
    isVisible,
    step,
    currentDeal?._id,
    currentDeal?.p2pSaleTimeEnd,
  ]);

  useEffect(() => {
    if (!currentDeal?._id) return;

    if (!currentDeal.isReservedFunds || currentDeal.status === "ended") {
      clearStoredP2PPaymentDeadline(currentDeal._id);
    }
  }, [currentDeal?._id, currentDeal?.isReservedFunds, currentDeal?.status]);

  useEffect(() => {
    if (!isVisible || !currentDeal?.date) {
      return;
    }

    const closeIfExpired = () => {
      const isExpired = new Date(currentDeal.date).getTime() < Date.now();
      if (!isExpired) {
        return;
      }

      setIsChatExpanded(false);
      setIsMinimized(false);
      onClose();
    };

    closeIfExpired();
    const intervalId = setInterval(closeIfExpired, 20000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isVisible, currentDeal?.date, onClose]);

  const shouldShowMinimizeButton = step !== "buy" && step !== "sell";

  if (currentDeal?.isAppeal) {
    return <></>
  }

  if (isPaymentModalOpen) {
    return (
      <PaymentMethodModal
        isVisible={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
        }}
      />
    );
  }

  if (isMinimized && isVisible) {
    return (
      <MinimizedBar
        status={getMinimizedStatus()}
        label={getMinimizedLabel()}
        timeLeft={minimizedTimeLeft}
        formatTime={formatTime}
        onExpand={handleMinimize}
        pendingText={minimizedPendingText}
      />
    );
  }

  return (
    <>
      <MainModal
        className={`p2p-buy-modal ${isChatExpanded ? "chat-expanded" : ""}`}
        title={getModalTitle(step, currentDeal)}
        variant="deal"
        onClose={handleClose}
        isModalBack={step === "appeal" ? backBtnAction : undefined}
        isCloseIcon={!shouldShowMinimizeButton}
        isVisible={isVisible}
      >
        {shouldShowMinimizeButton && (
          <S.MinimizeButton onClick={handleMinimize}>
            <Minimize2 size={20} />
          </S.MinimizeButton>
        )}
        <S.ModalContent isChatExpanded={isChatExpanded}>
          <S.MainContent className="deal-info">
            {step === "buy" && (
              <BuyStep
                deal={currentDeal}
                onProceed={() => setStep("make-payment")}
                onClose={handleClose}
                refetchDeals={triggerDealRefresh}
              />
            )}

            {step === "sell" && (
              <SellStep
                deal={currentDeal}
                refetchDeals={triggerDealRefresh}
                onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
                onClose={handleClose}
              />
            )}

            {step === "make-payment" && (
              <MakePayment
                deal={currentDeal}
                step={step}
                isChatExpanded={isChatExpanded}
                setIsChatExpanded={setIsChatExpanded}
                setStep={setStep}
                onAppeal={openAppeal}
                onClose={handleClose}
                onCloseCompletely={handleCompleteClose}
                onReserveFunds={async () => {
                  await onReserveFunds?.();
                }}
                onMarkPayment={onMarkPayment}
                onRefetch={triggerDealRefresh}
              />
            )}

            {step === "releasing" && (
              <ReleasingStep
                deal={currentDeal}
                releaseTimeLeft={releaseTimeLeft}
                formatTime={formatTime}
                isChatExpanded={isChatExpanded}
                setIsChatExpanded={setIsChatExpanded}
                onAppeal={() => openAppeal("releasing")}
                onCancel={() => openAppeal("releasing")}
              />
            )}

            {step === "appeal" && (
              <AppealStep
                dealId={currentDeal?._id}
                onSubmit={async () => {
                  await triggerDealRefresh();
                  await refetchDeals?.();
                  handleCompleteClose();
                }}
                onClose={handleClose}
              />
            )}

            {step === "completed" && (
              <CompletedStep
                deal={currentDeal}
                isChatExpanded={isChatExpanded}
                setIsChatExpanded={setIsChatExpanded}
                onClose={handleClose}
                onCompleteClose={handleCompleteClose}
                onSubmitFeedback={onSubmitFeedback}
              />
            )}
          </S.MainContent>

          {isChatExpanded && (
            <ChatSidebar
              className="chat-sidebar"
              deal={currentDeal}
              step={step}
              formatTime={formatTime}
              timeLeft={timeLeft}
              releaseTimeLeft={releaseTimeLeft}
              systemNotifications={[]}
              onHideChat={() => setIsChatExpanded(false)}
            />
          )}
        </S.ModalContent>
      </MainModal>
    </>
  );
};

export default P2PBuyModal;
