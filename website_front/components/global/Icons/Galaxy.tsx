import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const GalaxyIcon: FC<IconInterface> = ({ className, fill = "#05A584" }) => {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="20" fill={fill} />
      <path d="M27.6458 27.6449C33.678 21.6127 35.145 13.2997 30.9225 9.07719C27.5031 5.65779 21.4012 5.96948 16.0003 9.41517M9.07817 30.9215C12.3822 34.2256 18.1909 34.046 23.4515 30.9215M12.3548 12.3538C7.97359 16.7351 6.00062 22.3195 6.86671 26.666" stroke="white" stroke-width="1.5" stroke-linecap="round" />
      <path d="M26.5533 13.4467C24.0198 10.9132 19.032 11.7934 15.4127 15.4127C11.7934 19.032 10.9132 24.0198 13.4467 26.5533C15.9802 29.0868 20.968 28.2066 24.5873 24.5873C26.7859 22.3887 27.9738 19.685 27.9996 17.3333" stroke="white" stroke-width="1.5" stroke-linecap="round" />
      <path d="M22.1841 17.8162C23.0286 18.6607 22.7352 20.3233 21.5288 21.5298C20.3223 22.7362 18.6597 23.0296 17.8152 22.1851C16.9707 21.3406 17.2641 19.678 18.4706 18.4715C19.677 17.2651 21.3396 16.9717 22.1841 17.8162Z" stroke="white" stroke-width="1.5" stroke-linecap="round" />
    </svg>

  );
};

export default GalaxyIcon;
