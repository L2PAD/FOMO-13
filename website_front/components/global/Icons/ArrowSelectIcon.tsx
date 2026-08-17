import React, { FC } from "react";

const ArrowSelectIcon: FC<{
  fill?: string;
  className?: string | "rotate-90";
  style?: any;
  variant?: "default" | "small";
}> = ({ fill = "#070B35", className, style = {}, variant }) => {
  if (variant === "small") {
    return (
      <svg
        style={style}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M19.5 9L12 16.5L4.5 9"
          stroke="#738094"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      style={style}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="7"
      viewBox="0 0 12 7"
      fill="none"
    >
      <path
        d="M1 1L6.00081 5.58L11 1"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ArrowSelectIcon;
