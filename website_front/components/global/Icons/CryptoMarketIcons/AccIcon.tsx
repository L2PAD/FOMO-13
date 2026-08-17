import React, { FC } from "react";
import { ICryptoIconProps } from "./RecentlyIcon";

const AccIcon: FC<ICryptoIconProps> = ({ isActive }) => {
  const fillColor = isActive ? "#04A584" : "#738094";
  return (
    <svg
      width="16"
      height="18"
      viewBox="0 0 16 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.00047 17L14.9287 13V5L8.00047 1L1.07227 5V13L8.00047 17ZM8.00047 17V9.5M8.00047 9.5L1.50047 5.5M8.00047 9.5L14.5005 5.5"
        stroke={fillColor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default AccIcon;
