import { IDeal } from "../../../../../../types/global_types";
import { IBuyModalStep } from "../types";
import { PaymentDetails } from "../helpers";

export interface MakePaymentProps {
  isChatExpanded: boolean;
  step: IBuyModalStep;
  deal: IDeal | null;
  setIsChatExpanded: (expanded: boolean) => void;
  setStep: (step: IBuyModalStep) => void;
  onAppeal: (fromStep: IBuyModalStep) => void;
  onClose: () => void;
  onCloseCompletely?: () => void;
  onReserveFunds?: () => void;
  onMarkPayment?: () => void;
  onRefetch?: () => void;
}

export interface MakePaymentPreReserveProps {
  deal: IDeal;
  isSeller: boolean;
  sellerName: string;
  isChatExpanded: boolean;
  setIsChatExpanded: (expanded: boolean) => void;
  onReserveFunds?: () => void;
}

export interface MakePaymentSellerReservedProps {
  deal: IDeal;
  timeLeft: number;
  userBalance: number;
  isChatExpanded: boolean;
  setIsChatExpanded: (expanded: boolean) => void;
  onCopy: (text: string, label: string) => void;
  onAppeal: () => void;
  onRefresh: () => void;
  onReturnFunds: () => void;
  isReturningFunds: boolean;
}

export interface MakePaymentFlowProps {
  deal: IDeal;
  isMakePayment: boolean;
  isSeller: boolean;
  isBuyer: boolean;
  isChatExpanded: boolean;
  setIsChatExpanded: (expanded: boolean) => void;
  timeLeft: number;
  sellerName: string;
  paymentDetails: PaymentDetails;
  onCopy: (text: string, label: string) => void;
  onMarkPayment?: () => void;
  onAppeal: () => void;
  onCompleteDeal: () => void;
  isCompleting: boolean;
  onCloseCompletely?: () => void;
}
