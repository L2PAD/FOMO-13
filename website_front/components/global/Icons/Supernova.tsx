import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const SupernovaIcon: FC<IconInterface> = ({ className, fill = "#05A584" }) => {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="20" fill={fill} />
      <path d="M31.333 10.666C32.4376 10.666 33.333 9.77059 33.333 8.66602C33.333 7.56145 32.4376 6.66602 31.333 6.66602C30.2284 6.66602 29.333 7.56145 29.333 8.66602C29.333 9.77059 30.2284 10.666 31.333 10.666Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M8.66699 33.334C9.77156 33.334 10.667 32.4386 10.667 31.334C10.667 30.2294 9.77156 29.334 8.66699 29.334C7.56242 29.334 6.66699 30.2294 6.66699 31.334C6.66699 32.4386 7.56242 33.334 8.66699 33.334Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M32.0516 21.417C32.8105 21.2363 33.3337 20.6583 33.3337 20.0007C33.3337 19.343 32.8105 18.765 32.0516 18.5843L26.0286 17.1502C24.96 14.8943 22.6624 13.334 20.0003 13.334C17.3382 13.334 15.0406 14.8943 13.972 17.1502L7.94902 18.5843C7.19017 18.765 6.66699 19.343 6.66699 20.0007C6.66699 20.6583 7.19017 21.2363 7.94902 21.417L13.972 22.8511C15.0406 25.107 17.3382 26.6673 20.0003 26.6673C22.6624 26.6673 24.96 25.107 26.0286 22.8511L32.0516 21.417Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M19.9997 22.6673C21.4724 22.6673 22.6663 21.4734 22.6663 20.0007C22.6663 18.5279 21.4724 17.334 19.9997 17.334C18.5269 17.334 17.333 18.5279 17.333 20.0007C17.333 21.4734 18.5269 22.6673 19.9997 22.6673Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M23.9997 7.27642C22.737 6.87982 21.3933 6.66602 19.9997 6.66602C15.6375 6.66602 11.7646 8.76082 9.33203 11.9993M15.9997 32.7223C17.2624 33.1189 18.6061 33.3327 19.9997 33.3327C24.3613 33.3327 28.2337 31.2384 30.6663 28.0006" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>


  );
};

export default SupernovaIcon;
