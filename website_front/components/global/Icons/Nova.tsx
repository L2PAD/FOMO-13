import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const NovaIcon: FC<IconInterface> = ({ className, fill = "#05A584" }) => {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="20" fill={fill} />
      <path d="M20 19.3125H20.0123" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M26.1762 19.3117C26.1762 21.9649 23.4109 24.1157 19.9997 24.1157C16.5885 24.1157 13.8232 21.9649 13.8232 19.3117C13.8232 16.6586 16.5885 14.5078 19.9997 14.5078C23.4109 14.5078 26.1762 16.6586 26.1762 19.3117Z" stroke="white" stroke-width="2" stroke-linecap="round" />
      <path d="M22.7441 28.2363C22.0367 28.6609 21.0677 28.9226 19.999 28.9226C18.9303 28.9226 17.9614 28.6609 17.2539 28.2363" stroke="white" stroke-width="2" stroke-linecap="round" />
      <path d="M19.9997 9.01953C13.5564 9.01953 8.33301 14.2429 8.33301 20.6862C8.33301 23.5345 9.3537 26.1444 11.0493 28.17C11.8601 29.1388 12.4507 30.3098 12.4507 31.5731C12.4507 32.7618 13.4143 33.7254 14.603 33.7254H25.3964C26.5851 33.7254 27.5487 32.7618 27.5487 31.5731C27.5487 30.3098 28.1392 29.1388 28.9501 28.17C30.6457 26.1444 31.6663 23.5345 31.6663 20.6862C31.6663 14.2429 26.443 9.01953 19.9997 9.01953Z" stroke="white" stroke-width="2" stroke-linecap="round" />
      <path d="M25.4902 10.393C25.719 9.15774 26.8628 6.6048 29.6079 6.27539" stroke="white" stroke-width="2" stroke-linecap="round" />
      <path d="M14.5102 10.393C14.2815 9.15774 13.1377 6.6048 10.3926 6.27539" stroke="white" stroke-width="2" stroke-linecap="round" />
    </svg>

  );
};

export default NovaIcon;
