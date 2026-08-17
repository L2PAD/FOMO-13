/* eslint-disable */
import React from "react";

const Arrow = ({ className, size }: { className?: string; size?: number }) => {
  return (
    <svg
      width={size || "16"}
      height={size || "16"}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.59961 11.2008L5.18361 7.75463L8.25561 10.7085L14.3996 4.80078M14.3996 4.80078H9.79161M14.3996 4.80078V9.23155"
        stroke="#05A584"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

export default Arrow;
