import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const SendTimeIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
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
        d="M5 3V5H7V6.34375C7 7.66928 7.52624 8.94155 8.46484 9.87891L10.5859 12L8.46484 14.1211C7.52624 15.0584 7 16.3307 7 17.6562V19H5V21H19V19H17V17.6562C17 16.3308 16.4725 15.0584 15.5352 14.1211L13.4141 12L15.5352 9.87891C16.4732 8.94085 17 7.66928 17 6.34375V5H19V3H5ZM9 5H15V6.34375C15 7.14022 14.685 7.9009 14.1211 8.46484L12 10.5859L9.87891 8.46289C9.31551 7.90025 9 7.14022 9 6.34375V5ZM12 13.4141L14.1211 15.5352C14.6838 16.0979 15 16.8617 15 17.6562V19H13.8027C13.3098 17.6747 12 17 12 17C12 17 10.6902 17.6747 10.1973 19H9V17.6562C9 16.8598 9.31551 16.0998 9.87891 15.5371L12 13.4141Z"
        fill={fill}
      />
    </svg>
  );
};

export default SendTimeIcon;
