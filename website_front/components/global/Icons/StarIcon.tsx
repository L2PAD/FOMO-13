import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const StarIcon: FC<IconInterface> = ({
  className,
  fill = "black",
  variant,
}) => {
  if (variant === "outlined") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="15"
        viewBox="0 0 16 15"
        fill="none"
      >
        <path
          d="M7.66242 1.31084C7.80013 1.0318 8.19802 1.0318 8.33573 1.31084L10.1184 4.92292C10.1731 5.03372 10.2788 5.11052 10.4011 5.12829L14.3872 5.70751C14.6952 5.75226 14.8181 6.13067 14.5953 6.34787L11.7109 9.15948C11.6224 9.24573 11.582 9.37 11.6029 9.49178L12.2838 13.4618C12.3364 13.7685 12.0145 14.0024 11.7391 13.8576L8.17377 11.9832C8.0644 11.9257 7.93374 11.9257 7.82437 11.9832L4.25903 13.8576C3.98361 14.0024 3.66172 13.7685 3.71432 13.4618L4.39524 9.49178C4.41612 9.37 4.37575 9.24573 4.28727 9.15948L1.40285 6.34787C1.18003 6.13067 1.30298 5.75226 1.61091 5.70751L5.59708 5.12829C5.71936 5.11052 5.82506 5.03372 5.87975 4.92292L7.66242 1.31084Z"
          stroke={fill}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      id="favorite"
      width="15"
      height="14"
      viewBox="0 0 16 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        id="favorite"
        d="M8 0L10.9154 3.98728L15.6085 5.52786L12.7172 9.53272L12.7023 14.4721L8 12.96L3.29772 14.4721L3.28276 9.53272L0.391548 5.52786L5.08459 3.98728L8 0Z"
        fill={fill}
      />
    </svg>
  );
};

export default StarIcon;
