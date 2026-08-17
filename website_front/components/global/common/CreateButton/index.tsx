import React, { FC } from "react";
import styled from "styled-components";

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: 1px solid #04a584;
  border-radius: 4px;
  color: #04a584;
  transition: all 0.3s ease;

  path {
    transition: stroke 0.3s ease;
  }

  &:hover {
    border: 1px solid #39816a;
    color: #39816a;
    path {
      stroke: #39816a;
    }
  }

  &:active {
    border: 1px solid #2e6a58;
    color: #2e6a58;
    path {
      stroke: #2e6a58;
    }
  }

  &.no-border {
    border: none !important;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    padding-left: 0px;
  }
`;

interface IProps {
  type?: "create" | "add";
  children: any;
  className?: "no-border" | string;
  onClick: () => void;
}

const CreateButton: FC<IProps> = ({
  children,
  className,
  onClick,
  type = "create",
}) => {
  return (
    <Button className={className} onClick={onClick}>
      {type === "create" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="17"
          height="16"
          viewBox="0 0 17 16"
          fill="none"
        >
          <path
            d="M10.9241 7.99963H8.67407M8.67407 7.99963H6.42407M8.67407 7.99963V10.2496M8.67407 7.99963L8.67407 5.74965M14.6738 4.24999L14.6738 11.75C14.6738 12.9926 13.6665 14 12.4238 14H4.92383C3.68119 14 2.67383 12.9926 2.67383 11.75V4.24999C2.67383 3.00735 3.68119 2 4.92383 2H12.4238C13.6665 2 14.6738 3.00735 14.6738 4.24999Z"
            stroke="#04A584"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="9"
          height="8"
          viewBox="0 0 9 8"
          fill="none"
        >
          <path
            d="M4.50078 0.800781L4.50078 7.20078M7.70078 4.00078L1.30078 4.00078"
            stroke="#04A584"
            strokeLinecap="round"
          />
        </svg>
      )}
      {children}
    </Button>
  );
};

export default CreateButton;
