import React from "react";
import * as S from "../styles";
import { Clock, X, CheckCircle } from "lucide-react";
import { MinimizedBarProps } from "../types";

const MinimizedBar: React.FC<MinimizedBarProps> = ({
    withdrawStatus,
    timeLeft,
    formatTime,
    handleMinimize,
}) => {
    return (
        <S.MinimizedBar status={withdrawStatus || "pending"}>
            <S.MinimizedContent status={withdrawStatus || "pending"}>
                {withdrawStatus === "pending" && (
                    <>
                        <Clock size={36} color="#FFC704" />
                        <span>{formatTime(timeLeft)}</span>
                    </>
                )}
                {withdrawStatus === "rejected" && (
                    <>
                        <X size={20} />
                        <span>Rejected</span>
                    </>
                )}
                {withdrawStatus === "cancelled" && (
                    <>
                        <X size={20} />
                        <span>Cancelled</span>
                    </>
                )}
                {withdrawStatus === "confirmed" && (
                    <>
                        <CheckCircle size={20} />
                        <span>Confirmed</span>
                    </>
                )}
            </S.MinimizedContent>
            <S.ExpandButton
                status={withdrawStatus || "pending"}
                onClick={handleMinimize}
            >
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
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </S.ExpandButton>
        </S.MinimizedBar>
    );
};

export default MinimizedBar;