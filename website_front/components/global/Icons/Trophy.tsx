/* eslint-disable */
import React from "react";

const Trophy = ({ className, size }: { className?: string; size?: number }) => {
  return (
    <svg
      width={size || "32"}
      height={size || "32"}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.0674 15.9975L9.40499 15.9974C8.4041 15.7871 7.47297 15.2028 6.74528 14.3123C5.8179 13.1775 5.2969 11.6384 5.2969 10.0336L5.29688 7.46743C5.29687 7.15147 5.50445 6.87304 5.80727 6.78285C12.4594 4.80154 19.5447 4.80155 26.1969 6.78287C26.4996 6.87306 26.7072 7.15147 26.7072 7.46743V10.0336C26.7072 11.6384 26.1862 13.1775 25.2588 14.3123C24.5272 15.2077 23.5896 15.7935 22.5825 16.0008L21.9334 16.0007"
        stroke="#05A584"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M15.9922 21.5273V26.717"
        stroke="#05A584"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M11.873 26.7168H20.1148"
        stroke="#05A584"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M10.0362 15.3081C10.14 18.5842 12.724 21.513 16.0019 21.513C19.3375 21.513 21.8498 18.6358 21.9647 15.3023C21.9863 14.6747 21.998 14.0406 21.998 13.4001C21.998 10.8026 21.8246 8.15699 21.5411 5.81058C19.7597 5.41288 17.9277 5.28711 16.0019 5.28711C14.0761 5.28711 12.2071 5.39761 10.4626 5.81058C10.1638 8.14712 10.0059 10.8026 10.0059 13.4001C10.0059 14.0428 10.0162 14.6787 10.0362 15.3081Z"
        stroke="#05A584"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

export default Trophy;
