import React, { FC, useState } from "react";
import { ArrowDownIcon } from "../../Icons";
import Checkbox from "../Checkbox";
import { HeaderWrapper, Wrapper } from "./styles";

interface Props {
  title: string;
  progress: number;
  isDone: boolean;
  maxProgress: number;
  children: any;
  onChange: () => void;
}

const Rollup: FC<Props> = ({
  title,
  progress,
  isDone,
  maxProgress,
  children,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Wrapper variant="default">
      <HeaderWrapper
        active={isOpen}
        onClick={() => setIsOpen((state) => !state)}
      >
        <div>
          <Checkbox checked={isDone} onChange={onChange} />
          {title}
        </div>
        <div>
          {progress}/{maxProgress}
          <button>
            <ArrowDownIcon />
          </button>
        </div>
      </HeaderWrapper>
      {isOpen && <div>{children}</div>}
    </Wrapper>
  );
};

export default Rollup;
