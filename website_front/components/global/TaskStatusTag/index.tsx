import React, { FC } from "react";
import Tag from "../common/Tag";

export interface StatusTagInterface {
  type?: any | "project";
  variant: "" | "pending" | "finished" | string;
  className?: string;
}

const StatusTag: FC<StatusTagInterface> = ({ type, variant, className }) => {
  const getVariant = ({ variant }: StatusTagInterface) => {
    switch (variant) {
      case "pending":
        return "warn";
      case "":
        return "default";
      case "finished":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Tag
      variant={getVariant({ variant })}
      label={variant.charAt(0).toUpperCase() + variant.slice(1)}
      className={className}
    />
  );
};

export default StatusTag;
