import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const CopyIcon: FC<IconInterface> = ({ className, fill = "black", type }) => {
  if (type === 'new') {
    return (
      <svg width="14" height="17" viewBox="0 0 14 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.5 9.50004L13.5 3.50003C13.5 1.84317 12.1568 0.500016 10.5 0.500036L4.725 0.500104M8.3 16.5L2.45 16.5C1.37305 16.5 0.500002 15.6046 0.500002 14.5L0.5 5.8334C0.5 4.72884 1.37304 3.83341 2.45 3.83341L8.3 3.83341C9.37695 3.83341 10.25 4.72884 10.25 5.8334L10.25 14.5C10.25 15.6046 9.37696 16.5 8.3 16.5Z" stroke={fill} strokeLinecap="round" />
      </svg>

    )
  }

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 13L19 7.00003C19 5.34317 17.6568 4.00002 16 4.00004L10.225 4.0001M13.8 20L7.95 20C6.87305 20 6 19.1046 6 18L6 9.3334C6 8.22884 6.87304 7.33341 7.95 7.33341L13.8 7.33341C14.877 7.33341 15.75 8.22884 15.75 9.3334L15.75 18C15.75 19.1046 14.877 20 13.8 20Z" stroke={fill} strokeLinecap="round" />
    </svg>

  );
};

export default CopyIcon;
