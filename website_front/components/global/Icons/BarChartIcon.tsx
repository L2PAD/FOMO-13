import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const BarChartIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.75 3V21H21.75V3H15.75ZM17.25 4.5H20.25V19.5H17.25V4.5ZM2.25 7.5V21H8.25V7.5H2.25ZM3.75 9H6.75V19.5H3.75V9ZM9 12V21H15V12H9ZM10.5 13.5H13.5V19.5H10.5V13.5Z"
        fill={fill}
      />
    </svg>
  );
};

export default BarChartIcon;
