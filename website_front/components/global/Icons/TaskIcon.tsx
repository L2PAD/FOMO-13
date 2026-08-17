import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const TaskIcon: FC<IconInterface> = ({ className, fill = "black" }) => {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.47341 16.4293H2.49113C1.39145 16.4293 0.499993 15.5378 0.5 14.4381L0.500077 2.49116C0.500084 1.39147 1.39154 0.5 2.49121 0.5H11.4515C12.5512 0.5 13.4427 1.39148 13.4427 2.49117V6.47351M3.9848 4.48234H9.95821M3.9848 7.4691H9.95821M3.9848 10.4559H6.9715M9.46027 13.6841L13.6841 9.46015L16.5 12.2761L12.2762 16.5H9.46027V13.6841Z" stroke="#05A584" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
};

export default TaskIcon;
