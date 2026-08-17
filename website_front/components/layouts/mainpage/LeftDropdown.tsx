import React, { FC, useState } from "react";
import Link from "next/link";
import { ArrowDownIcon } from "../../global/Icons";

interface Props {
  title: string;
  items: { title: string; link: string }[];
}

const LeftDropdown: FC<Props> = ({ title, items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dropdown-wrapper" onMouseLeave={() => setIsOpen(false)}>
      <div className="list-title scew" onMouseEnter={() => setIsOpen(true)}>
        <ArrowDownIcon fill="white" />
        <p>{title}</p>
      </div>
      <div className={`dropdown-drop-wrapper-left ${!isOpen && "hide"}`}>
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

export default LeftDropdown;
