import React, { FC } from "react";

const LockIcon: FC<{ color?: string }> = ({ color = "#738094" }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="20" fill="#B5BCC7" />
      <path d="M13.25 16V14.8571C13.25 11.0585 16.2607 8 20 8C23.7393 8 26.75 11.0585 26.75 14.8571V16M13.25 16C12.0125 16 11 17.0286 11 18.2857V29.7143C11 30.9714 12.0125 32 13.25 32H26.75C27.9875 32 29 30.9714 29 29.7143V18.2857C29 17.0286 27.9875 16 26.75 16M13.25 16H26.75" stroke="#F0F2F5" stroke-width="2" stroke-linecap="round" />
    </svg>
  );
};

export default LockIcon;
