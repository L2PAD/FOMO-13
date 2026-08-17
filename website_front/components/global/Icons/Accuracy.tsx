/* eslint-disable */
import React from "react";

const Accuracy = ({
  className,
  size,
}: {
  className?: string;
  size?: number;
}) => {
  return (
    <svg
      width={size || "16"}
      height={size || "16"}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.00065 3.66732V1.33398M8.00065 14.6673V12.334M12.334 8.00065H14.6673M1.33398 8.00065H3.66732M13.334 8.00065C13.334 10.9462 10.9462 13.334 8.00065 13.334C5.05513 13.334 2.66732 10.9462 2.66732 8.00065C2.66732 5.05513 5.05513 2.66732 8.00065 2.66732C10.9462 2.66732 13.334 5.05513 13.334 8.00065Z"
        stroke="#05A584"
        stroke-linecap="round"
      />
    </svg>
  );
};

export default Accuracy;
