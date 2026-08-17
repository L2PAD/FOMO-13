import React from "react";

const AnalyticsIcon: React.FC<{ color?: string }> = ({ color = "#05A584" }) => {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.40039 1.40039V12.6004H12.6004M4.20039 8.40046L6.65039 5.95046L8.40039 7.70046L11.5505 4.55039"
        stroke={color}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

export default AnalyticsIcon;
