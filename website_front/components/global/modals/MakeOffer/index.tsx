import React, { FC, useMemo, useRef, useState } from "react";
import Modal from "../../common/Modal";
import {
  Description,
  Wrapper,
  SubmitButton,
  ConfirmWrapper,
  Buttons,
  TextareaWrapper,
  Container,
  Attachment,
  Details,
  CheckboxWrapper,
  LabelWrapper,
} from "./styles";
import Input from "../../common/Input";
import Button from "../../common/Button";
import { ButtonWrapper } from "../LeaveFeedback/styles";
import { ResetWrapper } from "../../Filter/alloc-styles";
import { File, RotateCcw } from "lucide-react";
import Checkbox from "../../common/Checkbox";

interface Props {
  onClose: () => void;
}

const initialState = {
  amount: "",
  email: "",
  telegram: "",
  message: "",
  projectName: "",
  agree: false,
};

const MakeOfferModal: FC<Props> = ({ onClose }) => {
  const [errors, setErrors] = useState<{
    projectName?: string;
    amount?: string;
    email?: string;
    message?: string;
  }>({});

  const [formData, setFormData] = useState<
    typeof initialState & { attachment: File | null }
  >({ ...initialState, attachment: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setFormData({ ...initialState, attachment: null });
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, attachment: file }));
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.email) {
      newErrors.email = "This field is required!";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format!";
    }

    if (!formData.message) {
      newErrors.message = "This field is required!";
    }

    if (!formData.amount) {
      newErrors.amount = "This field is required!";
    }

    if (!formData.agree) {
      newErrors.message = "You must agree to the Privacy Policy!";
    }

    if (!formData.projectName) {
      newErrors.projectName = "This field is required!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Submit logic here
      console.log("Form submitted:", formData);
    }
  };

  return (
    <Container>
      <Modal onClose={onClose} title="Make Offer">
        <Wrapper>
          <div>
            <Input
              placeholder="Enter project name"
              labelText="Project name"
              type="text"
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, projectName: value }));
                if (errors.projectName) {
                  setErrors((prev) => ({ ...prev, projectName: undefined }));
                }
              }}
              value={formData.projectName}
            />
            {errors.projectName && (
              <div
                style={{ color: "#FF5858", fontSize: "12px", marginTop: "4px" }}
              >
                {errors.projectName}
              </div>
            )}
          </div>
          <div>
            <Input
              placeholder="Enter amount"
              labelText="Allocation Size ($)"
              type="amount"
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, amount: value }));
                if (errors.amount) {
                  setErrors((prev) => ({ ...prev, amount: undefined }));
                }
              }}
              value={formData.amount}
            />
            {errors.amount && (
              <div
                style={{ color: "#FF5858", fontSize: "12px", marginTop: "4px" }}
              >
                {errors.amount}
              </div>
            )}
          </div>
          <div>
            <Input
              placeholder="Enter your email"
              labelText="Email"
              type="email"
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, email: value }));
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              value={formData.email}
            />
            {errors.email && (
              <div
                style={{ color: "#FF5858", fontSize: "12px", marginTop: "4px" }}
              >
                {errors.email}
              </div>
            )}
          </div>

          <Input
            placeholder="Enter your username"
            labelText="Telegram Username"
            type="text"
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, telegram: value }));
            }}
            value={formData.telegram}
          />

          <div>
            <TextareaWrapper>
              <label htmlFor="message">Your Message</label>
              <textarea
                id="message"
                placeholder="Briefly explain your idea or project"
                value={formData.message}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, message: e.target.value }));
                  if (errors.message) {
                    setErrors((prev) => ({ ...prev, message: undefined }));
                  }
                }}
              />
            </TextareaWrapper>
            {errors.message && (
              <div
                style={{ color: "#FF5858", fontSize: "12px", marginTop: "4px" }}
              >
                {errors.message}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="attachment">Attachment</label>
            <Attachment
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="box">
                <File width={24} height={24} />
              </div>
              <input
                id="attachment"
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.pdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <div>
                {formData.attachment
                  ? formData.attachment.name
                  : "Add a file with detailed information about your idea or project (Max 50 MB, PNG/JPG/SVG/PDF)"}
              </div>
            </Attachment>
          </div>

          <CheckboxWrapper>
            <Checkbox
              className="checkbox"
              checked={formData.agree}
              onChange={() =>
                setFormData((prev) => ({ ...prev, agree: !prev.agree }))
              }
            />
            <LabelWrapper>
              <span>I agree with the</span> <a href="#">Privacy Policy</a>
            </LabelWrapper>
          </CheckboxWrapper>

          <ConfirmWrapper>
            <Buttons>
              <Button onClick={onClose} className="red-btn">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                Submit request
              </Button>
            </Buttons>
            <ResetWrapper>
              <Button onClick={handleReset} className="reset-btn">
                <RotateCcw size={16} />
                Reset
              </Button>
            </ResetWrapper>
          </ConfirmWrapper>
        </Wrapper>
      </Modal>
    </Container>
  );
};

export default MakeOfferModal;
