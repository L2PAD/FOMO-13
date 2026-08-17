import React, { FC } from "react";

const AttatchmentIcon: FC<{ color: string }> = ({ color = "#738094" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="18"
      viewBox="0 0 16 18"
      fill="none"
    >
      <path
        d="M14.9152 8.70096L8.3101 15.3061C6.51233 17.1038 3.81613 17.3161 1.98318 15.4832C0.18541 13.6854 0.419062 11.0809 2.25201 9.24799L9.67685 1.82315C10.8132 0.686795 12.6426 0.686794 13.779 1.82315C14.9154 2.95951 14.9154 4.78895 13.779 5.92531L6.22379 13.4805C5.6574 14.0469 4.7391 14.0469 4.17272 13.4805C3.60633 12.9141 3.60633 11.9958 4.17272 11.4294L10.9082 4.69396"
        stroke={color}
        strokeLinecap="round"
      />
    </svg>
  );
};

export default AttatchmentIcon;
