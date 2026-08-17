import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const RatingIcon: FC<IconInterface> = ({
  className,
  fill = "#FF5858",
  onClick,
}) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
    >
      <path d="M9.5 12V6H15.5V3L21.5 9L15.5 15V12H9.5Z" stroke={fill} />
      <path d="M15.5 18V12H9.5V9L3.5 15L9.5 21V18H15.5Z" stroke={fill} />
    </svg>
  );
};

export default RatingIcon;
