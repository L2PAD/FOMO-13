import { IDeal } from "../../../../../types/global_types";
import { IBuyModalStep } from "./types";

export type SystemNotificationType = "warning" | "success";

export interface SystemNotification {
  message: string;
  time: string;
  type: SystemNotificationType;
}

export const getModalTitle = (
  step: IBuyModalStep,
  deal: IDeal | null,
): string => {
  const ticker = deal?.ticker?.toUpperCase() || "";

  switch (step) {
    case "buy":
      return `Buy ${ticker}`;
    case "sell":
      return `Sell ${ticker}`;
    case "make-payment":
      return "Make Payment";
    case "releasing":
      return "Releasing";
    case "appeal":
      return "Appeal";
    case "completed":
      return "Order Completed";
    default:
      return `Buy ${ticker}`;
  }
};

export const getSystemNotifications = (
  step: IBuyModalStep,
): SystemNotification[] => {
  switch (step) {
    case "releasing":
      return [
        {
          message:
            "Payment confirmation submitted.\nThe seller has been notified — please wait for verification.",
          time: "Today at 10:35 AM",
          type: "warning",
        },
      ];
    case "completed":
      return [
        {
          message:
            "Payment confirmation submitted.\nThe seller has been notified — please wait for verification.",
          time: "Today at 10:35 AM",
          type: "warning",
        },
        {
          message:
            "Seller confirmed the payment — your crypto is being delivered now!",
          time: "Today at 10:36 AM",
          type: "warning",
        },
      ];
    default:
      return [];
  }
};

export const getBackStep = (step: IBuyModalStep): IBuyModalStep => {
  switch (step) {
    case "make-payment":
    case "sell":
      return "buy";
    case "releasing":
    case "appeal":
      return "make-payment";
    case "completed":
      return "appeal";
    default:
      return "buy";
  }
};
