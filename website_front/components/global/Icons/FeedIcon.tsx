import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const FeedIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.5 0.5C6.39104 0.5 11.1667 5.27563 11.1667 11.1667M0.5 5.83333C3.44552 5.83333 5.83333 8.22115 5.83333 11.1667M0.5 11.1667H0.53125" stroke="#05A584" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
};

export default FeedIcon;
