import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const ArrowRightIcon: FC<IconInterface> = ({
  className,
  fill = "black",
  type,
  onClick,
}) => {
  if (type === "new") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          d="M11.3333 3L18 10M18 10L11.3333 17M18 10L2 10"
          stroke="#738094"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      onClick={onClick}
      width="8"
      height="13"
      viewBox="0 0 8 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M1 1L6.25 6.25L1 11.5" stroke={fill} strokeWidth="2" />
    </svg>
  );
};

export default ArrowRightIcon;
