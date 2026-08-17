import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const HourGlassIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="25"
      viewBox="0 0 24 25"
      fill="none"
    >
      <path
        d="M5.25 3.5H19.25M5.25 21.5H19.25M17.5 3.5V6.14723C17.5 6.83742 17.262 7.5065 16.8262 8.04167L13.9511 11.572C13.4422 12.1969 13.4543 13.0794 13.9801 13.6912L16.775 16.9423C17.2428 17.4865 17.5 18.1803 17.5 18.8979V21.5M7 3.5V6.14723C7 6.83742 7.23798 7.5065 7.67383 8.04167L10.5489 11.572C11.0578 12.1969 11.0457 13.0794 10.5199 13.6912L7.72505 16.9423C7.25724 17.4865 7 18.1803 7 18.8979V21.5"
        stroke="#070B35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default HourGlassIcon;
