import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const QuasarIcon: FC<IconInterface> = ({ className, fill = "#05A584" }) => {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="20" fill={fill} />
      <path d="M16.0491 18.4893L17.4569 21.3283C17.6489 21.7235 18.1609 22.1025 18.5928 22.1751L21.1445 22.6026C22.7764 22.8768 23.1603 24.0705 21.9844 25.248L20.0007 27.2482C19.6647 27.5869 19.4807 28.2402 19.5847 28.708L20.1526 31.184C20.6006 33.1438 19.5687 33.902 17.8489 32.8777L15.4572 31.4501C15.0252 31.192 14.3133 31.192 13.8733 31.4501L11.4816 32.8777C9.7698 33.902 8.72991 33.1358 9.17786 31.184L9.7458 28.708C9.84979 28.2402 9.66581 27.5869 9.32984 27.2482L7.34606 25.248C6.17819 24.0705 6.55415 22.8768 8.18597 22.6026L10.7377 22.1751C11.1616 22.1025 11.6736 21.7235 11.8656 21.3283L13.2734 18.4893C14.0413 16.9489 15.2892 16.9489 16.0491 18.4893Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M33.3337 6.66602L22.667 17.3327M25.3337 6.66602L18.667 13.3327M30.667 17.3327L26.667 21.3327" stroke="white" stroke-width="1.5" stroke-linecap="round" />
    </svg>
  );
};

export default QuasarIcon;
