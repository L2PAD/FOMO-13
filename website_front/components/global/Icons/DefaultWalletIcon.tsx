import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const DefaultWalletIcon: FC<IconInterface> = ({ className, fill }) => {
  return (
    <svg className={className} width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.9 0.5H1.9C1.1268 0.5 0.501667 1.29164 0.500947 2.10714C0.5 3.17857 1.1268 4.2381 1.9 4.2381H16.5C17.6046 4.2381 18.5 4.01946 18.5 5.07143V14.2143C18.5 15.4767 17.4255 16.5 16.1 16.5H2.9C1.57452 16.5 0.5 15.4767 0.5 14.2143V2.64286M13.7157 9.62794L13.7 9.64286" stroke={fill} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default DefaultWalletIcon;
