import React, { FC, useState } from "react";
import Button from "../common/Button";
import { VerticalDotsIcon } from "../Icons";
import { DropdownWrapper, Wrapper } from "./styles";

interface Props {
  items: { title: string; onClick: () => void }[];
}

const DotsButtonWithDropdown: FC<Props> = ({ items }) => {
  const [hide, setHide] = useState(true);

  return (
    <Wrapper
      onBlur={(e) => {
        setHide(true);
      }}
    >
      <Button
        onClick={() => {
          setHide((state) => !state);
        }}
      >
        <VerticalDotsIcon />
      </Button>
      <DropdownWrapper hide={hide}>
        {items.map(({ title, onClick }, i) => {
          return (
            <div
              key={i}
              onClick={() => {
                onClick();
                setHide(true);
              }}
            >
              {title}
            </div>
          );
        })}
      </DropdownWrapper>
    </Wrapper>
  );
};

export default DotsButtonWithDropdown;
