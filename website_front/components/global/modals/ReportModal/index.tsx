/* eslint-disable */
import React, { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";
import MainModal from "../../common/MainModal";
import CustomSelect from "../../common/CustomSelect";
import CustomTextarea from "../../common/CustomTextarea";
import { Button } from "../../common/Button";
import { Action } from "../../LeftNav/styles";
import { Actions } from "../../UniversalFilter/styles";
import { ModalRow } from "../creating_project/styles";
import { InputError } from "../../../layouts/projects/modals/CreatePortfolio/styles";
import {
  getPublicReasons,
  createTrustReport,
  ReportTargetType,
  TrustReason,
  CreateReportPayload,
} from "../../../../http/trust";

interface Props {
  isVisible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId?: string;
  /** Extra context automatically attached to the report (page, author, snapshot, etc.) */
  targetSnapshot?: Record<string, any>;
  /** Human readable label of what is being reported, e.g. "comment", "user", "message" */
  targetLabel?: string;
  onReported?: () => void;
}

const titleFor = (t: ReportTargetType): string => {
  switch (t) {
    case "COMMENT":
      return "Report comment";
    case "MESSAGE":
      return "Report message";
    case "USER":
      return "Report user";
    default:
      return "Report";
  }
};

const ReportModal: FC<Props> = ({
  isVisible,
  onClose,
  targetType,
  targetId,
  targetSnapshot = {},
  targetLabel,
  onReported,
}) => {
  const [reasons, setReasons] = useState<TrustReason[]>([]);
  const [loadingReasons, setLoadingReasons] = useState(false);
  const [reasonCode, setReasonCode] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isVisible) return;
    setReasonCode("");
    setDescription("");
    setError("");
    setLoadingReasons(true);
    getPublicReasons(targetType)
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setReasons(res.data);
        else setReasons([]);
      })
      .finally(() => setLoadingReasons(false));
  }, [isVisible, targetType]);

  const options = reasons.map((r) => ({ value: r.code, label: r.label }));

  const submit = async (): Promise<void> => {
    if (!reasonCode) {
      setError("Please choose a reason.");
      return;
    }
    setSubmitting(true);
    setError("");
    const payload: CreateReportPayload = {
      targetType,
      targetId,
      reasonCode,
      description: description.trim(),
      targetSnapshot: { ...targetSnapshot, reportedAt: new Date().toISOString() },
    };
    const { success, status } = await createTrustReport(payload);
    setSubmitting(false);
    if (success) {
      toast.success(
        <div>
          <h3>Report submitted</h3>
          <p>We&apos;ll review it.</p>
        </div>
      );
      onReported && onReported();
      onClose();
    } else if (status === 401) {
      toast.error(
        <div>
          <h3>Sign in required</h3>
          <p>Please log in to submit a report.</p>
        </div>
      );
    } else {
      setError("Could not submit the report. Please try again.");
    }
  };

  return (
    <MainModal
      variant={"medium"}
      isVisible={isVisible}
      onClose={onClose}
      title={titleFor(targetType)}
    >
      <div style={{ padding: "4px 0 0", fontSize: 14, color: "#738094", lineHeight: 1.5 }}>
        Help us keep FOMO safe. Tell us what&apos;s wrong with this
        {" "}
        {targetLabel || targetType.toLowerCase()} and our team will review it.
      </div>

      <ModalRow>
        <p>Reason</p>
        <CustomSelect
          placeholder={loadingReasons ? "Loading reasons…" : "Select a reason"}
          options={options}
          onChange={(value: string) => {
            setReasonCode(value);
            setError("");
          }}
        />
      </ModalRow>

      <ModalRow>
        <CustomTextarea
          value={description}
          label="Details (optional)"
          placeholder="Add any details that help us understand the issue"
          isMaxCharacters={true}
          maxCharacters={500}
          onChange={(value: string) => setDescription(value)}
        />
      </ModalRow>

      {error ? (
        <InputError style={{ marginTop: 8 }}>{error}</InputError>
      ) : null}

      <Actions>
        <Action onClick={onClose} actionType="red">
          Cancel
        </Action>
        <Button onClick={submit} variant={"primary"} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit report"}
        </Button>
      </Actions>
    </MainModal>
  );
};

export default ReportModal;
