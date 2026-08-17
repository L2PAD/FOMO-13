import React, { FC } from "react";

const SupportButtonIcon: FC = () => {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_i_285_680)">
        <path
          d="M15 1.875C8.8125 1.875 3.75 6.84375 3.75 13.0312V16.3125C3.75 16.4062 3.75 16.4062 3.75 16.5C3.75 16.5938 3.75 16.7812 3.75 16.875C3.75 19.5 5.8125 21.5625 8.4375 21.5625C9 21.5625 9.375 21.1875 9.375 20.625V13.125C9.375 12.5625 9 12.1875 8.4375 12.1875C7.40625 12.1875 6.375 12.5625 5.625 13.125V12.9375C5.625 7.875 9.84375 3.75 15 3.75C20.1562 3.75 24.375 7.875 24.375 13.0312V13.125C23.625 12.5625 22.5938 12.1875 21.5625 12.1875C21 12.1875 20.625 12.5625 20.625 13.125V20.625C20.625 21.1875 21 21.5625 21.5625 21.5625C22.2188 21.5625 22.875 21.375 23.4375 21.1875C22.5 23.1562 20.8125 24.6562 18.75 25.5C18.75 25.4062 18.75 25.4062 18.75 25.3125C18.75 24.75 18.375 24.375 17.8125 24.375H15C14.4375 24.375 14.0625 24.75 14.0625 25.3125V27.1875C14.0625 27.75 14.4375 28.125 15 28.125C21.1875 28.125 26.25 23.25 26.25 17.25V16.3125V14.0625V13.0312C26.25 6.84375 21.1875 1.875 15 1.875Z"
          fill="url(#paint0_linear_285_680)"
        />
      </g>
      <defs>
        <filter
          id="filter0_i_285_680"
          x="0"
          y="0"
          width="30"
          height="34"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect1_innerShadow_285_680"
          />
        </filter>
        <linearGradient
          id="paint0_linear_285_680"
          x1="15"
          y1="1.875"
          x2="15"
          y2="28.125"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#04A53B" />
          <stop offset="1" stopColor="#041A15" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default SupportButtonIcon;
