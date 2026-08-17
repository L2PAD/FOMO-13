import React, { FC, useState } from "react";
import Link from "next/link";
import { ArrowDownIcon } from "../../global/Icons";

interface Props {
  title: string;
  items: { title: string; link: string }[];
}

const Dropdown: FC<Props> = ({ title, items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dropdown-wrapper" onMouseLeave={() => setIsOpen(false)}>
      <div className="list-title scew" onMouseEnter={() => setIsOpen(true)}>
        <p>{title}</p>
        <ArrowDownIcon fill="white" />
      </div>
      <div className={`dropdown-drop-wrapper ${!isOpen && "hide"}`}>
        {items.map((item, i) => {
          return (
            <Link href={item.link} key={i}>
              {item.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Dropdown;
