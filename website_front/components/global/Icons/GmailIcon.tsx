import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const GmailIcon: FC<IconInterface> = ({ className, fill }) => {
  return (
    <svg
      width="20"
      height="12"
      viewBox="0 0 20 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M1.69124 0L9.20687 7.01432C9.65154 7.43032 10.3488 7.43032 10.7928 7.01432L18.3084 0H1.69124ZM0.666504 0.867188V12H19.3332V0.867188L11.703 7.98828C11.225 8.43428 10.6125 8.65755 9.99984 8.65755C9.38717 8.65755 8.77471 8.43428 8.29671 7.98828L0.666504 0.867188Z"
        fill={fill}
      />
    </svg>
  );
};

export default GmailIcon;
