import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const ListViewIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2" y="4" width="16" height="2.5" rx="1" fill={fill} />
      <rect x="2" y="8.75" width="16" height="2.5" rx="1" fill={fill} />
      <rect x="2" y="13.5" width="16" height="2.5" rx="1" fill={fill} />
    </svg>
  );
};

export default ListViewIcon;
