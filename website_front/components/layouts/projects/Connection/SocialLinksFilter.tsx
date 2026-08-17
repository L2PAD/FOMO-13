import React from "react";
import styled from "styled-components";
import { icons } from "../../../global/common/SocialLinks";

const SocialLinksWrapper = styled.div`
  position: absolute;
  top: 20px;
  right: 150px;
  z-index: 1000;
  display: flex;
  align-items: center;
  background: white;
  padding: 4px;
  border-radius: 12px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    left: 20px;
    top: 70px;
    width: fit-content;
  }
`;

const SocialButton = styled.button<{ isActive: boolean }>`
  width: 44px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  box-shadow: ${({ isActive }) =>
    isActive ? "2px 2px 8px 0px #00053014" : "none"};

  svg path {
    fill: ${({ isActive }) => (isActive ? "#04A584" : "#738094")};
    transition: fill 0.2s ease;
  }

  &:hover {
    box-shadow: 2px 2px 8px 0px #00053014;

    svg path {
      fill: #04a584;
    }
  }
`;

interface SocialLinksFilterProps {
  currentFilter: string;
  onFilterChange: (filterName: string) => void;
}

const SocialLinksFilter: React.FC<SocialLinksFilterProps> = ({
  currentFilter,
  onFilterChange,
}) => {
  const socialKeys = ["x", "link", "threads"] as const;

  return (
    <SocialLinksWrapper>
      {socialKeys.map((key) => (
        <SocialButton
          key={key}
          isActive={currentFilter === key}
          onClick={() => onFilterChange(key)}
        >
          {icons[key]}
        </SocialButton>
      ))}
    </SocialLinksWrapper>
  );
};

export default SocialLinksFilter;
