import React, { FC } from "react";
import { ExternalLinkWStyle } from "./styles";

export interface ExternalLinkInterface {
  link: string;
  label: string;
  newWindow?: boolean;
  className?: string;
}

const ExternalLink: FC<ExternalLinkInterface> = ({
  link,
  newWindow = true,
  className,
  label,
}) => {
  return (
    <ExternalLinkWStyle
      className={className}
      href={link}
      target={newWindow ? "_blank" : ""}
      rel="noopener noreferrer"
    >
      {label}
    </ExternalLinkWStyle>
  );
};

export default ExternalLink;
