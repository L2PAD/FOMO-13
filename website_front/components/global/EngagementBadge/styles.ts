import styled from "styled-components";

interface BadgeProps {
  variant: "success" | "warn" | "alert";
}

const getBadgeColor = ({ variant }: BadgeProps) => {
  switch (variant) {
    case "success":
      return "rgba(5, 165, 132, 0.1)"; // Light green background for High
    case "warn":
      return "rgba(255, 193, 7, 0.1)"; // Light yellow background for Medium
    case "alert":
      return "rgba(255, 88, 88, 0.1)"; // Light red background for Low
    default:
      return "rgba(5, 165, 132, 0.1)";
  }
};

const getBadgeTextColor = ({ variant }: BadgeProps) => {
  switch (variant) {
    case "success":
      return "var(--color-primary)"; // Green text for High
    case "warn":
      return "#FFC107"; // Yellow text for Medium
    case "alert":
      return "var(--color-danger)"; // Red text for Low
    default:
      return "var(--color-primary)";
  }
};

export const BadgeWrapper = styled.div<BadgeProps>`
  background: ${({ variant }) => getBadgeColor({ variant })};
  color: ${({ variant }) => getBadgeTextColor({ variant })};
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  line-height: 14px;
  border-radius: 6px;
  padding: 4px 12px;
  width: max-content;
  text-align: center;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;
