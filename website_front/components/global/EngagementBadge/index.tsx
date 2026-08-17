import React, { FC } from "react";
import { BadgeWrapper } from "./styles";

export interface EngagementBadgeProps {
  level: "high" | "medium" | "low" | string;
  className?: string;
}

const EngagementBadge: FC<EngagementBadgeProps> = ({ level, className }) => {
  const getVariant = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "success";
      case "medium":
        return "warn";
      case "low":
        return "alert";
      default:
        return "success";
    }
  };

  return (
    <BadgeWrapper variant={getVariant(level)} className={className}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </BadgeWrapper>
  );
};

export default EngagementBadge;
