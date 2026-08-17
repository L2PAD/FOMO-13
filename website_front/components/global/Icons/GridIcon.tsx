import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const GridIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="7" height="7" rx="1" fill={fill} />
      <rect y="9" width="7" height="7" rx="1" fill={fill} />
      <rect x="9" width="7" height="7" rx="1" fill={fill} />
      <rect x="9" y="9" width="7" height="7" rx="1" fill={fill} />
    </svg>
  );
};

export default GridIcon;
