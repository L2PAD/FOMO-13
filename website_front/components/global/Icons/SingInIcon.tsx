import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const SingInIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
  return (
    <svg
      className={className}
      width="17"
      height="20"
      viewBox="0 0 17 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill={fill}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.00042 8.4375V15H13.1433V10H14.429V15C14.429 15.6875 13.8504 16.25 13.1433 16.25H8.00042V20L0.993276 16.6C0.56899 16.3875 0.286133 15.95 0.286133 15.4625V1.25C0.286133 0.5625 0.864704 0 1.57185 0H13.1433C13.8504 0 14.429 0.5625 14.429 1.25V5H13.1433V1.25H2.85756L8.00042 3.75V6.5625L11.8576 3.75V6.25H17.0004V8.75H11.8576V11.25L8.00042 8.4375Z"
      />
    </svg>
  );
};

export default SingInIcon;
