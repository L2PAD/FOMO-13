import React, { FC, useState } from "react";
import { ArrowDownIcon } from "../Icons";
import { ContentWrapper, HeaderWrapper } from "./styles";

interface Props {
  title: string;
  children: any;
}

const SimpleDropdown: FC<Props> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <HeaderWrapper
        isOpen={isOpen}
        onClick={() => setIsOpen((state) => !state)}
      >
        <ArrowDownIcon /> {title}
      </HeaderWrapper>
      <ContentWrapper>{children}</ContentWrapper>
    </div>
  );
};

export default SimpleDropdown;
