import React from "react";
import { Check, CheckCircle2 } from "lucide-react";
import {
  ToastContainer,
  ToastContent,
  ToastIcon,
  ToastText,
  ToastTitle,
  ToastDescription,
  ToastButton,
} from "./DuelToast.styles";

interface DuelToastProps {
  title: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export const DuelToast: React.FC<DuelToastProps> = ({
  title,
  description,
  buttonText,
  onButtonClick,
}) => {
  return (
    <ToastContainer>
      <ToastContent>
        <CheckCircle2 size={34} />
        <ToastText>
          <ToastTitle>{title}</ToastTitle>
          {description && <ToastDescription>{description}</ToastDescription>}
        </ToastText>
      </ToastContent>
      {buttonText && onButtonClick && (
        <ToastButton onClick={onButtonClick}>{buttonText}</ToastButton>
      )}
    </ToastContainer>
  );
};
