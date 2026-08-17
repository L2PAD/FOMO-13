import React, { FC } from "react";
import Tag from "../common/Tag";

export interface StatusTagInterface {
  type?: any | "project" | "project-table";
  variant?: "upcoming" | "ended" | "active" | "inactive" | string;
  className?: string;
}

const StatusTag: FC<StatusTagInterface> = ({ type, variant, className }) => {
  const getVariant = ({ variant }: StatusTagInterface) => {
    switch (variant) {
      case "upcoming":
        return "warn";
      case "ended":
        return "alert";
      case "active":
        return "success";
      case "inactive":
        return "alert";
      default:
        return "success";
    }
  };

  const normalizedVariant = variant || "active";

  return (
    <Tag
      variant={getVariant({ variant: normalizedVariant })}
      label={
        normalizedVariant.charAt(0).toUpperCase() + normalizedVariant.slice(1)
      }
      className={`${className} ${type}`}
    />
  );
};

export default StatusTag;
