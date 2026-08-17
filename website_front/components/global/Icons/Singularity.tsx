import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const SingularityIcon: FC<IconInterface> = ({ className, stroke = "#05A584", size = 24 }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9.24999 1.33398C6.40852 2.97119 6.74999 7.58398 6.74999 7.58398C6.74999 7.58398 5.5 7.16731 5.5 5.29233C4.00867 6.15708 3 7.81922 3 9.66731C3 12.4287 5.23858 14.6673 8.00001 14.6673C10.7614 14.6673 13 12.4287 13 9.66731C13 5.60482 9.24999 4.77148 9.24999 1.33398V1.33398ZM8.4392 12.9445C7.43446 13.195 6.41685 12.5836 6.16629 11.5788C5.91579 10.574 6.52721 9.55636 7.532 9.30586C9.95774 8.70106 10.2617 7.33696 10.2617 7.33696C10.2617 7.33696 11.4714 12.1884 8.4392 12.9445V12.9445Z" fill="white" />
    </svg>
  );
};

export default SingularityIcon;
