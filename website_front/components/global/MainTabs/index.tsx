import React, { FC } from "react";
import { BreadcrumbsWrapper, Crumb } from "./styles";

export interface MainTabsInterface {
  items: { title: string, isSectionUpdate: boolean }[];
  activeItem: string;
  className?: string;
  onClick: (value: string) => void;
}

const MainTabs: FC<MainTabsInterface> = ({
  items,
  activeItem,
  className,
  onClick,
}) => {
  
  return (
    <BreadcrumbsWrapper className={className}>
      {items.map((item, i) => {
        return (
          <Crumb
            key={i}
            onClick={() => onClick(item.title)}
            active={activeItem === item.title}
          >
            {item.title}
            {
              item.isSectionUpdate
                ?
                <div className='update-marker'>
                </div>
                :
                <></>
            }
          </Crumb>
        );
      })}
    </BreadcrumbsWrapper>
  );
};

export default MainTabs;
