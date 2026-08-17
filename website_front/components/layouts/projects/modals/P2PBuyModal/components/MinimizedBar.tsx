import React from "react";
import * as S from "../styles";
import { CheckCircle, Clock, X } from "lucide-react";

interface MinimizedBarProps {
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  label: string;
  timeLeft: number;
  formatTime: (seconds: number) => string;
  onExpand: () => void;
  pendingText?: string;
}

const MinimizedBar: React.FC<MinimizedBarProps> = ({
  status,
  label,
  timeLeft,
  formatTime,
  onExpand,
  pendingText,
}) => {
  return (
    <S.MinimizedBar status={status}>
      <S.MinimizedContent status={status}>
        {status === "pending" && (
          <>
            <Clock size={36} color="#FFC704" />
            <span>{pendingText || formatTime(timeLeft)}</span>
          </>
        )}
        {status === "rejected" && (
          <>
            <X size={20} />
            <span>{label}</span>
          </>
        )}
        {status === "cancelled" && (
          <>
            <X size={20} />
            <span>{label}</span>
          </>
        )}
        {status === "confirmed" && (
          <>
            <CheckCircle size={20} />
            <span>{label}</span>
          </>
        )}
      </S.MinimizedContent>
      <S.ExpandButton status={status} onClick={onExpand}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 17H1M1 17V13M1 17L5.5 12.5M13 1H17M17 1V5M17 1L12.5 5.5M1 5L1 1M1 1L5 1M1 1L5.5 5.5M17 13L17 17M17 17H13M17 17L12.5 12.5"
            stroke="#738094"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </S.ExpandButton>
    </S.MinimizedBar>
  );
};

export default MinimizedBar;
