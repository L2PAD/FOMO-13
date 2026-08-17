import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const CosmosIcon: FC<IconInterface> = ({ className, fill = "#05A584" }) => {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="20" fill={fill} />
      <path d="M19.9997 22.6673C21.4724 22.6673 22.6663 21.4734 22.6663 20.0007C22.6663 18.5279 21.4724 17.334 19.9997 17.334C18.5269 17.334 17.333 18.5279 17.333 20.0007C17.333 21.4734 18.5269 22.6673 19.9997 22.6673Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M30.6667 27.9993C32.1394 27.9993 33.3333 26.8054 33.3333 25.3327C33.3333 23.8599 32.1394 22.666 30.6667 22.666C29.1939 22.666 28 23.8599 28 25.3327C28 26.8054 29.1939 27.9993 30.6667 27.9993Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M18.6667 33.3333C20.1394 33.3333 21.3333 32.1394 21.3333 30.6667C21.3333 29.1939 20.1394 28 18.6667 28C17.1939 28 16 29.1939 16 30.6667C16 32.1394 17.1939 33.3333 18.6667 33.3333Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M23.9997 11.9993C25.4724 11.9993 26.6663 10.8054 26.6663 9.33268C26.6663 7.85992 25.4724 6.66602 23.9997 6.66602C22.5269 6.66602 21.333 7.85992 21.333 9.33268C21.333 10.8054 22.5269 11.9993 23.9997 11.9993Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M9.33366 17.3333C10.8064 17.3333 12.0003 16.1394 12.0003 14.6667C12.0003 13.1939 10.8064 12 9.33366 12C7.8609 12 6.66699 13.1939 6.66699 14.6667C6.66699 16.1394 7.8609 17.3333 9.33366 17.3333Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M23.0631 11.8301L20.9363 17.5017M21.4929 10.2441L11.8398 13.7543M19.6689 22.6456L18.9972 28.0196M22.3854 21.1921L28.2807 24.1397M28.2289 26.4159L21.1038 29.5826" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>

  );
};

export default CosmosIcon;
