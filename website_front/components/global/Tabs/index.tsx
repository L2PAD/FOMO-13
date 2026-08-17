import React, { FC } from "react";
import { TabsWrapper } from "./styles";
import Tab from "./Tab";

export interface TabsInterface {
  items: string[];
  activeItem: string;
  className?: "big" | "main" | "secondary" | string;
  onClick: (value: string) => void;
  isDisabled?: boolean;
  descriptions?: Array<{ text: string; index: number }>;
  itemsWithLogo?: { logo?: string | null, name: string }[]
}

const Tabs: FC<TabsInterface> = ({
  items,
  itemsWithLogo,
  activeItem,
  className,
  onClick,
  isDisabled,
  descriptions,
}) => {
  const getTabDescription = (
    tabIndex: number
  ): { text: string; index: number } | undefined => {
    if (!descriptions?.length) return;

    return descriptions.find((item) => item.index === tabIndex);
  };

  return (
    <TabsWrapper className={className} role="tablist">
      {(itemsWithLogo || items).map((item: { name: string, logo?: string | null } | string, i: number) => {
        if (item == "FAV") {
          const isActive = activeItem === "FAV";

          return (
            <button
              key={i}
              onClick={() => onClick("FAV")}
              className={isActive ? "fav-tab active" : "fav-tab"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <path
                  d="M8.57924 1.26159C8.75138 0.912803 9.24874 0.912803 9.42088 1.26159L11.6492 5.77669C11.7176 5.9152 11.8497 6.0112 12.0026 6.03341L16.9853 6.75744C17.3702 6.81337 17.5239 7.28639 17.2453 7.55788L13.6398 11.0724C13.5292 11.1802 13.4787 11.3355 13.5049 11.4878L14.356 16.4504C14.4218 16.8337 14.0194 17.126 13.6751 16.9451L9.21843 14.602C9.08172 14.5302 8.9184 14.5302 8.78169 14.602L4.32501 16.9451C3.98074 17.126 3.57837 16.8337 3.64412 16.4504L4.49526 11.4878C4.52137 11.3355 4.4709 11.1802 4.3603 11.0724L0.754778 7.55788C0.476254 7.28639 0.629947 6.81337 1.01486 6.75744L5.99757 6.03341C6.15042 6.0112 6.28255 5.9152 6.35091 5.77669L8.57924 1.26159Z"
                  fill={isActive ? "#FFC702" : "none"}
                  stroke={isActive ? "#FFC702" : "#738094"}
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          );
        }
        return (
          <Tab
            disabled={isDisabled && i > 0}
            key={i}
            item={typeof item === 'string' ? item : item.name}
            logo={typeof item === 'string' ? '' : item?.logo || ''}
            onClick={onClick}
            active={activeItem === (typeof item === 'string' ? item : item.name)}
            description={getTabDescription(i)}
          />
        );
      })}
    </TabsWrapper>
  );
};

export default Tabs;
