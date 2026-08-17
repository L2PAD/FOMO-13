import React, { ReactNode } from "react";
import Link from "next/link";

interface Props {
  href: string;
  image: ReactNode;
}

const BeautifullIconButton = ({ href, image }: Props) => (
  <Link href={href}>
    <div className="beautiful-icon-button">{image}</div>
  </Link>
);

export default BeautifullIconButton;
