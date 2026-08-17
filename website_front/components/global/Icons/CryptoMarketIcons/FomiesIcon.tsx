import React, { FC } from "react";
import { ICryptoIconProps } from "./RecentlyIcon";

const FomiesIcon: FC<ICryptoIconProps> = ({ isActive }) => {
  const fillColor = isActive ? "#04A584" : "#738094";

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.3545 17.1441L13.3548 14.4659C13.3549 12.9866 12.1557 11.7873 10.6764 11.7873H4.67868C3.19957 11.7873 2.00047 12.9863 2.0003 14.4654L2 17.1441M10.4115 5.53775C10.4115 7.01698 9.21235 8.21613 7.73312 8.21613C6.25389 8.21613 5.05474 7.01698 5.05474 5.53775C5.05474 4.05853 6.25389 2.85938 7.73312 2.85938C9.21235 2.85938 10.4115 4.05853 10.4115 5.53775Z"
        stroke={fillColor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.9997 3.33203L15.708 4.85717L17.3774 5.05949L16.1457 6.2044L16.4692 7.85457L14.9997 7.03703L13.5302 7.85457L13.8537 6.2044L12.6221 5.05949L14.2914 4.85717L14.9997 3.33203Z"
        stroke={fillColor}
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default FomiesIcon;
