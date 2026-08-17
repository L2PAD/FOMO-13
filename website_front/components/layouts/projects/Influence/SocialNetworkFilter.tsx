import React from "react";
import styled from "styled-components";
import { icons } from "../../../global/common/SocialLinks";

const SocialLinksWrapper = styled.div`
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

interface SocialNetworkFilterProps {
  currentFilter: string;
  onFilterChange: (filterName: string) => void;
}

const SocialNetworkFilter: React.FC<SocialNetworkFilterProps> = ({
  currentFilter,
  onFilterChange,
}) => {
  const networks = [
    { key: "x", label: "X (Twitter)" },
    { key: "ds", label: "Discord" },
    { key: "tg", label: "Telegram" },
    { key: "inst", label: "Instagram" },
    { key: "link", label: "LinkedIn" },
    { key: "tiktok", label: "TikTok" },
    { key: "threads", label: "Threads" },
  ];

  return (
    <SocialLinksWrapper>
      {networks.map((network) => (
        <SocialButton
          key={network.key}
          isActive={currentFilter === network.key}
          onClick={() => onFilterChange(network.key)}
          title={network.label}
        >
          {icons[network.key]}
        </SocialButton>
      ))}
    </SocialLinksWrapper>
  );
};

export default SocialNetworkFilter;
