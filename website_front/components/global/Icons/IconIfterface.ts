export interface IconInterface {
  className?: string;
  fill?: string;
  onClick?: () => void;
  isActive?: boolean;
  type?: "new" | "default" | "gray";
  size?: "big" | "small" | number;
  variant?: "outlined" | "default";
  stroke?: string;
  width?: number;
  height?: number;
}
