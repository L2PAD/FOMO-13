/* eslint-disable */
import React from "react";

const League: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = "#05A584",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.01251 9.01257L5.00586 13.9326C5.00586 14.5326 5.42586 14.8259 5.94586 14.5792L7.73252 13.7326C7.87919 13.6593 8.12586 13.6593 8.27252 13.7326L10.0659 14.5792C10.5792 14.8192 11.0059 14.5326 11.0059 13.9326V8.89258"
        stroke={color}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M8 10.0007C5.51472 10.0007 3.5 8.06055 3.5 5.66732C3.5 3.27408 5.51472 1.33398 8 1.33398C10.4853 1.33398 12.5 3.27408 12.5 5.66732C12.5 8.06055 10.4853 10.0007 8 10.0007Z"
        stroke={color}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

export default League;
