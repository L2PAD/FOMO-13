/* eslint-disable */
import React, { FC } from "react";
import Filter from "../Filter";
import { GridIcon, StarIcon } from "../Icons";
import {
  GridWrapper,
  HeaderWrapper,
  LeftWrapper,
  ShowTopWrapper,
} from "./styles";
import { Sort, Props as SortInterface } from "../common/Sort";

interface Props {
  grid?: boolean;
  setGrid?: any;
  isGrid?: boolean;
  isFilter?: boolean;
  filters?: any;
  sort: SortInterface;
  onSelectedChange?: (value: any) => void;
  onRangeChange?: (values: any) => void;
}

const FilterSortHeader: FC<Props> = ({
  grid,
  setGrid,
  filters,
  isGrid = true,
  isFilter = true,
  sort,
  onSelectedChange,
  onRangeChange,
}) => {
  return (
    <HeaderWrapper>
      <LeftWrapper>
        {isFilter ? (
          <Filter
            onRangeChange={onRangeChange}
            onSelectedChange={onSelectedChange}
            filters={filters}
          />
        ) : (
          <></>
        )}
        {isGrid &&
          (grid ? (
            <ShowTopWrapper onClick={() => setGrid(false)}>
              <StarIcon fill="#FFC702" />
              Show Top
            </ShowTopWrapper>
          ) : (
            <GridWrapper onClick={() => setGrid(true)}>
              <GridIcon fill="#070B35" />
              Show Grid
            </GridWrapper>
          ))}
      </LeftWrapper>
      <Sort {...sort} />
    </HeaderWrapper>
  );
};

export default FilterSortHeader;
