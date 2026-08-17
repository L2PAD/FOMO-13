import React, { FC, useState, useContext, useEffect } from "react";
import * as S from "../styles";
import Button from "../../../../../global/common/Button";
import FakeLogo from "../../../../../global/Icons/FakeLogo";
import { AuthContext } from "../../../../../global/Layout";
import {
  LogoImage,
  LogoInput,
  LogoInputLabel,
  LogoWrapper,
} from "../../../../../global/modals/creating_project/styles";
import { createAppeal } from "../../../../../../http/deals/createAppeal";
import { uploadAppealAttachment } from "../../../../../../http/deals/uploadAppealAttachment";

interface AppealStepProps {
  dealId?: string;
  onSubmit: () => void | Promise<void>;
  onClose: () => void;
}

const AppealStep: FC<AppealStepProps> = ({ dealId, onSubmit, onClose }) => {
  const { userData } = useContext(AuthContext);
  const [file, setFile] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState(userData?.email || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userData?.email) {
      setEmail(userData.email);
    }
  }, [userData?.email]);

  const handleSubmit = async () => {
    if (!dealId) {
      setError("Deal is not available.");
      return;
    }

    if (!reason) {
      setError("Please select a reason for appeal.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    let attachments: string[] = [];
    if (file) {
      const uploadResult = await uploadAppealAttachment(file);
      if (!uploadResult.isSuccess || !uploadResult.url) {
        setIsSubmitting(false);
        setError(uploadResult.error || "Failed to upload attachment.");
        return;
      }
      attachments = [uploadResult.url];
    }

    const { isSuccess, error: submitError } = await createAppeal(dealId, {
      reason,
      description,
      email,
      attachments,
    });

    setIsSubmitting(false);

    if (!isSuccess) {
      setError(submitError || "Failed to submit appeal.");
      return;
    }

    await onSubmit();
  };

  return (
    <S.StepContent>
      <S.Section>
        <S.SectionTitle>Reason for appeal</S.SectionTitle>
        <S.Select
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        >
          <option value="">Select reason</option>
          <option value="payment-not-received">Payment not received</option>
          <option value="wrong-amount">Wrong amount</option>
          <option value="suspicious-activity">Suspicious activity</option>
          <option value="other">Other</option>
        </S.Select>
        {error && <S.ErrorText>{error}</S.ErrorText>}
      </S.Section>

      <S.Section>
        <S.SectionTitle>Description</S.SectionTitle>
        <S.Textarea
          placeholder="Want to add extra info? Type it here (Optional)"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <S.CharCount>300 Characters Max</S.CharCount>
      </S.Section>

      <LogoWrapper>
        <p style={{ fontSize: "16px" }}>Attachment</p>
        <div>
          <div className="">
            {file ? (
              <LogoImage
                //@ts-ignore
                src={URL.createObjectURL(file)}
                alt="logo"
              />
            ) : (
              <FakeLogo />
            )}
          </div>
          <LogoInputLabel htmlFor="logo-input">
            Tap to upload screenshots or receipts as evidence
            <br />
            (Max 15 MB, PNG/JPG/SVG)
          </LogoInputLabel>
          <LogoInput
            id="logo-input"
            name="logo"
            type="file"
            onChange={(event: any) => {
              if (event.target.files) {
                setFile(event.target.files[0]);
              }
            }}
          />
        </div>
      </LogoWrapper>

      <S.Section>
        <S.SectionTitle>Email</S.SectionTitle>
        <S.Input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </S.Section>

      <S.ButtonsRow>
        <S.CancelButton onClick={onClose}>Cancel</S.CancelButton>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
          Submit Appeal
        </Button>
      </S.ButtonsRow>
    </S.StepContent>
  );
};

export default AppealStep;
