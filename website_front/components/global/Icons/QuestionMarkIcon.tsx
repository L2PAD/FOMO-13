import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const QuestionMarkIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M8.99913 13V13.0352M7 6.53777C7 5.41234 7.89543 4.5 9 4.5C10.1046 4.5 11 5.41234 11 6.53777C11 7.6632 10.1046 8.57555 9 8.57555C9 8.57555 8.99913 9.18377 8.99913 9.93406M17 9C17 13.4183 13.4183 17 9 17C4.58172 17 1 13.4183 1 9C1 4.58172 4.58172 1 9 1C13.4183 1 17 4.58172 17 9Z"
        stroke={fill}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default QuestionMarkIcon;
