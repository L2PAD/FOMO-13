import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const PriorityIcon: FC<IconInterface> = ({ className, stroke = "#05A584", size = 24 }) => {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 13.9995H14V-0.00046885H0V13.9995Z" fill="black" />
    </svg>

  );
};

export default PriorityIcon;
