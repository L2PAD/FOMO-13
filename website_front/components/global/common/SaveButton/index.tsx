import React, { FC } from "react";
import { Wrapper } from "./styles";

interface IProps {
  isActive: boolean;
  value: number;
  onClick: () => void;
}

const SaveButton: FC<IProps> = ({ isActive, value, onClick }) => {
  return (
    <Wrapper onClick={onClick}>
      {isActive ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="21"
          viewBox="0 0 20 21"
          fill="none"
        >
          <path
            d="M4.1665 5C4.1665 3.89543 5.06193 3 6.1665 3H12.9998C14.1044 3 14.9998 3.89543 14.9998 5V16.8829C14.9998 17.3149 14.4889 17.5436 14.1667 17.2558L9.58317 13.1613L4.9996 17.2558C4.67742 17.5436 4.1665 17.3149 4.1665 16.8829V5Z"
            fill="#04A584"
            stroke="#04A584"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M4.1665 4.5C4.1665 3.39543 5.06193 2.5 6.1665 2.5H12.9998C14.1044 2.5 14.9998 3.39543 14.9998 4.5V16.3829C14.9998 16.8149 14.4889 17.0436 14.1667 16.7558L9.58317 12.6613L4.9996 16.7558C4.67742 17.0436 4.1665 16.8149 4.1665 16.3829V4.5Z"
            stroke="#738094"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span>{value}</span>
    </Wrapper>
  );
};

export default SaveButton;
