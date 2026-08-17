import React, { FC } from "react";
import { ICryptoIconProps } from "./RecentlyIcon";

const TrendingSearchIcon: FC<ICryptoIconProps> = ({ isActive }) => {
  const fillColor = isActive ? "#04A584" : "#738094";

  return (
    <svg
      width="14"
      height="18"
      viewBox="0 0 14 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.48901 10.2316L7.07817 1.44859C7.34673 1.02657 8 1.2168 8 1.71703V7.9C8 7.95523 8.04477 8 8.1 8H12.0397C12.4442 8 12.6813 8.45534 12.4493 8.78673L6.90962 16.7005C6.62928 17.101 6 16.9027 6 16.4138V11.1C6 11.0448 5.95523 11 5.9 11H1.91084C1.51629 11 1.27718 10.5644 1.48901 10.2316Z"
        stroke={fillColor}
      />
    </svg>
  );
};

export default TrendingSearchIcon;
