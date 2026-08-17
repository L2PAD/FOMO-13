import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const SelectedIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="25"
      viewBox="0 0 24 25"
      fill="none"
    >
      <rect x="3" y="3.5" width="18" height="18" rx="2" fill="#04A584" />
      <path
        d="M8.25 13.25L10.5 15.5L16.5 9.5"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SelectedIcon;
