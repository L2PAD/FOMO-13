import React from "react";

const LeaguesTabIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = "#728094",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.29211 9.99847L5.87812 9.99836C5.25257 9.86691 4.67061 9.50174 4.2158 8.94521C3.63619 8.23597 3.31057 7.27403 3.31057 6.27101L3.31055 4.66715C3.31054 4.46967 3.44028 4.29565 3.62954 4.23928C7.78712 3.00096 12.2154 3.00097 16.373 4.23929C16.5623 4.29566 16.692 4.46967 16.692 4.66715V6.27101C16.692 7.27403 16.3664 8.23597 15.7868 8.94521C15.3295 9.50483 14.7435 9.87095 14.114 10.0005L13.7084 10.0004"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.99609 13.4551V16.6986"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.41992 16.6992H12.571"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.27285 9.56778C6.33776 11.6154 7.95277 13.4459 10.0014 13.4459C12.0862 13.4459 13.6564 11.6476 13.7282 9.56415C13.7417 9.17192 13.749 8.77563 13.749 8.3753C13.749 6.75185 13.6406 5.09837 13.4634 3.63186C12.35 3.38329 11.205 3.30469 10.0014 3.30469C8.79781 3.30469 7.62971 3.37375 6.5394 3.63186C6.35261 5.09219 6.25391 6.75185 6.25391 8.3753C6.25391 8.777 6.26038 9.17446 6.27285 9.56778Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default LeaguesTabIcon;
