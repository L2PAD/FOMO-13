import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const ClockIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
  return (
    <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 6.5V9M9 9V11.5M9 9H11.5M9 9H6.5M3.88 14.26L1.64 16.5M16.36 16.5L14.12 14.26M3 0.5L0.5 3M17.5 3L15 0.5M16.04 9.14C16.04 13.0281 12.8881 16.18 9 16.18C5.11192 16.18 1.96 13.0281 1.96 9.14C1.96 5.25191 5.11192 2.1 9 2.1C12.8881 2.1 16.04 5.25191 16.04 9.14Z" stroke="#728094" stroke-linecap="round" />
    </svg>
  );
};

export default ClockIcon;
