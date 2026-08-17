import React, { FC } from "react";
import { Wrapper, FilterItem } from "./styles";

interface IWatchlistFilters {
  selectedKey: string;
  items: Array<{ key: string; value: string }>;
  onChange: (key: string) => void;
}

const WatchlistFilter: FC<IWatchlistFilters> = ({
  selectedKey,
  items,
  onChange,
}) => {
  return (
    <Wrapper>
      {items.map((filterItem: { key: string; value: string }) => {
        return (
          <FilterItem
            key={filterItem.key}
            onClick={() => {
              onChange(filterItem.key);
            }}
            isSelected={filterItem.key === selectedKey}
          >
            {filterItem.value}
          </FilterItem>
        );
      })}
    </Wrapper>
  );
};

export default WatchlistFilter;
