import React, { FC, useContext, useState } from "react";
import MainModal from "../../../../../global/common/MainModal";
import { Body, ModalWrapper, Overlay } from "./styles";
import MainMenu from "./MainMenu";
import BlockMenu from "./BlockMenu";
import ReportMenu from "./ReportMenu";
import ReportMessage from "./ReportMessage";
import ReportAccount from "./ReportAccount";
import ReportImpersonation from "./ReportImpersonation";
import { LoadingContext } from "../../../../../global/Layout";
import {
  ReportSubType,
  ReportType,
} from "../../../../../../http/reports/createReport";
import { createTrustReport } from "../../../../../../http/trust";
import { FomiesDataContext } from "../../../../../../pages/crypto/fomies/[id]";
import { toast } from "react-toastify";
import { useTranslation } from "i18n";

interface IProps {
  isVisible: boolean;
  onClose: () => void;
}

export type ConfirmReportData = {
  type: ReportType;
  subType: ReportSubType | null;
  body: string;
  attachment?: string;
};

const FomiesActionsMenu: FC<IProps> = ({ isVisible, onClose }) => {
  const { translateText } = useTranslation();
  const personData: any = useContext(FomiesDataContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const [step, setStep] = useState<string>("");

  // Map legacy report types to canonical Trust report reason codes.
  const LEGACY_REASON_MAP: Record<string, string> = {
    impersonality: "impersonation",
    inappropriateBehavior: "inappropriate_behavior",
    underageAccount: "underage_account",
  };

  const confirmReport = async (data: ConfirmReportData): Promise<void> => {
    loadingStateHandler(true);

    const { success, status } = await createTrustReport({
      targetType: "USER",
      targetId: personData?._id,
      reasonCode: LEGACY_REASON_MAP[data.type] || data.type,
      subReason: data.subType || "",
      description: data.body || "",
      targetSnapshot: {
        username: personData?.username || personData?.name || "",
        wallet: personData?.wallet || "",
        page: typeof window !== "undefined" ? window.location.pathname : "",
      },
    });

    if (success) {
      toast.success(
        <div>
          <h3>{translateText("Report submitted")}</h3>
          <p>{translateText("Thank you for your feedback. Our team will review it shortly.")}</p>
        </div>
      );
      onClose();
    } else if (status === 401) {
      toast.error(
        <div>
          <h3>{translateText("Sign in required")}</h3>
          <p>{translateText("Please log in to submit a report.")}</p>
        </div>
      );
    }

    loadingStateHandler(false);
  };

  const handleStep = (): any => {
    if (step === "block") return <BlockMenu onBack={() => setStep("")} />;

    if (step === "report")
      return (
        <ReportMenu
          onBack={() => setStep("")}
          updateStep={(step: string) => setStep(step)}
          onClose={onClose}
        />
      );

    if (step === "report-message") {
      return (
        <ReportMessage
          onBack={() => setStep("report")}
          updateStep={(step: string) => setStep(step)}
          onClose={onClose}
        />
      );
    }

    if (step === "report-account") {
      return (
        <ReportAccount
          onConfirm={confirmReport}
          onBack={() => setStep("report")}
          updateStep={(step: string) => setStep(step)}
          onClose={onClose}
        />
      );
    }

    if (step === "report-impersonation") {
      return (
        <ReportImpersonation
          onConfirm={confirmReport}
          onBack={() => setStep("report-account")}
          updateStep={(step: string) => setStep(step)}
          onClose={onClose}
        />
      );
    }

    return (
      <MainMenu
        onBlock={() => setStep("block")}
        onReport={() => setStep("report")}
        onClose={onClose}
      />
    );
  };

  return (
    <ModalWrapper isVisible={isVisible}>
      <Overlay
        onClick={() => {
          onClose();
          setTimeout(() => {
            setStep("");
          }, 500);
        }}
      />
      <Body>{handleStep()}</Body>
    </ModalWrapper>
  );
};

export default FomiesActionsMenu;
