import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const PauseIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.26686 2.13336C3.67753 2.13336 3.2002 2.6107 3.2002 3.20003V12.8C3.2002 13.3894 3.67753 13.8667 4.26686 13.8667H5.33353C5.92286 13.8667 6.4002 13.3894 6.4002 12.8V3.20003C6.4002 2.6107 5.92286 2.13336 5.33353 2.13336H4.26686ZM10.6669 2.13336C10.0775 2.13336 9.6002 2.6107 9.6002 3.20003V12.8C9.6002 13.3894 10.0775 13.8667 10.6669 13.8667H11.7335C12.3229 13.8667 12.8002 13.3894 12.8002 12.8V3.20003C12.8002 2.6107 12.3229 2.13336 11.7335 2.13336H10.6669Z"
        fill={fill}
      />
    </svg>
  );
};

export default PauseIcon;
