import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const AlertIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="16"
      viewBox="0 0 18 16"
      fill="none"
    >
      <path
        d="M9 8.78753V4.86266M9 11.6967V11.7312M14.0399 15H3.96006C2.5832 15 1.42127 14.1042 1.05569 12.8787C0.899637 12.3556 1.09139 11.8107 1.38467 11.3468L6.42461 2.4009C7.60542 0.533033 10.3946 0.533035 11.5754 2.4009L14.0954 6.87384L16.6153 11.3468C16.9086 11.8107 17.1004 12.3556 16.9443 12.8787C16.5787 14.1042 15.4168 15 14.0399 15Z"
        stroke={fill}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default AlertIcon;
