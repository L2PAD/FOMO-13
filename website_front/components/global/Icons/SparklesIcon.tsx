import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const SparklesIcon: FC<IconInterface> = ({ className, stroke = "#05A584", size = 24 }) => {
  if (typeof size === "string" && size === "small") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.88196 1.59961L11.1021 4.89708L14.3996 6.11726L11.1021 7.33743L9.88196 10.6349L8.66179 7.33743L5.36432 6.11726L8.66179 4.89708L9.88196 1.59961Z" stroke={stroke} stroke-linejoin="round" />
        <path d="M4.2349 9.12902L5.30079 10.6984L6.8702 11.7643L5.30079 12.8302L4.2349 14.3996L3.16902 12.8302L1.59961 11.7643L3.16902 10.6984L4.2349 9.12902Z" stroke={stroke} stroke-linejoin="round" />
      </svg>

    )

  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.0459 17.709C6.09574 17.8171 6.18286 17.9043 6.29102 17.9541L8.64844 19.04L6.30371 20.04C6.21657 20.0772 6.14216 20.138 6.08887 20.2148L6.04297 20.2969L4.95898 22.7305L3.96191 20.3096C3.92377 20.217 3.8594 20.1387 3.77734 20.084L3.69043 20.0381L1.26855 19.04L3.70312 17.957C3.81843 17.9057 3.91042 17.8124 3.95996 17.6963L4.95898 15.3506L6.0459 17.709ZM17.3486 6.35645C17.3993 6.4931 17.5069 6.60072 17.6436 6.65137L22.5586 8.46973L17.6436 10.2891C17.5409 10.3271 17.4546 10.3977 17.3965 10.4883L17.3486 10.585L15.5293 15.5L13.7109 10.585C13.6603 10.4481 13.5519 10.3397 13.415 10.2891L8.49902 8.46973L13.415 6.65137C13.5519 6.60072 13.6603 6.49329 13.7109 6.35645L15.5293 1.44043L17.3486 6.35645Z" fill="white" stroke={stroke} stroke-linejoin="round" />
    </svg>

  );
};

export default SparklesIcon;
