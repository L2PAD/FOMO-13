import React, { FC } from "react";
import { ICryptoIconProps } from "./RecentlyIcon";

const CommentsIcon: FC<ICryptoIconProps> = ({ isActive }) => {
  const fillColor = isActive ? "#04A584" : "#738094";

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.99902 6H11.999M5.99902 10H9.49902M16.999 9C16.999 10.15 16.7564 11.2434 16.3194 12.2316L17.0005 16.9992L12.9148 15.9778C11.7573 16.6287 10.4215 17 8.99902 17C4.58075 17 0.999023 13.4183 0.999023 9C0.999023 4.58172 4.58075 1 8.99902 1C13.4173 1 16.999 4.58172 16.999 9Z"
        stroke={fillColor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CommentsIcon;
