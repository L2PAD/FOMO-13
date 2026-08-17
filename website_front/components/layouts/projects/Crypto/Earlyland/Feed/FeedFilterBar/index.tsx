import React, { FC, useState } from "react";
import { CalendarIcon, StarIcon } from "../../../../../../global/Icons";
import {
  ChipCount,
  ChipLabel,
  DropdownWrapper,
  FilterBarWrapper,
  FilterButton,
  IconButton,
  LeftGroup,
  RightGroup,
  StarChip,
  TypeChip,
} from "./styles";
import CustomDropdown from "../../../../../../UI/CustomDropdown";
import { FilterIcon } from "lucide-react";
import { useTranslation } from "i18n";

export type FeedTypeFilter = string;

interface TypeChipConfig {
  value: FeedTypeFilter;
  label: string;
  count?: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ended", label: "Ended" },
];

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "popular", label: "Popular" },
];

interface Props {
  totalCount?: number;
  typeFilter?: FeedTypeFilter;
  onTypeFilterChange?: (value: FeedTypeFilter) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  sortFilter?: string;
  onSortFilterChange?: (value: string) => void;
  onFilterClick?: () => void;
  onCalendarClick?: () => void;
  filterActiveCount?: number;
  typeOptions?: TypeChipConfig[];
  othersCount?: number;
  favouritesCount?: number;
}

const FeedFilterBar: FC<Props> = ({
  totalCount = 10,
  typeFilter: typeFilterProp,
  onTypeFilterChange,
  statusFilter: statusFilterProp,
  onStatusFilterChange,
  sortFilter: sortFilterProp,
  onSortFilterChange,
  onFilterClick,
  onCalendarClick,
  filterActiveCount = 0,
  typeOptions = [],
  othersCount = 0,
  favouritesCount = 0,
}) => {
  const { translateText } = useTranslation();
  const [internalType, setInternalType] = useState<FeedTypeFilter>("all");
  const [internalStatus, setInternalStatus] = useState("all");
  const [internalSort, setInternalSort] = useState("default");

  const typeFilter = typeFilterProp ?? internalType;
  const statusFilter = statusFilterProp ?? internalStatus;
  const sortFilter = sortFilterProp ?? internalSort;

  const handleTypeChange = (value: FeedTypeFilter) => {
    if (!typeFilterProp) setInternalType(value);
    onTypeFilterChange?.(value);
  };

  const handleStatusChange = (value: string | string[]) => {
    const v = Array.isArray(value) ? value[0] : value;
    if (!statusFilterProp) setInternalStatus(v);
    onStatusFilterChange?.(v);
  };

  const handleSortChange = (value: string | string[]) => {
    const v = Array.isArray(value) ? value[0] : value;
    if (!sortFilterProp) setInternalSort(v);
    onSortFilterChange?.(v);
  };

  return (
    <FilterBarWrapper>
      {/* Left: type filter chips */}
      <LeftGroup>
        <TypeChip active={typeFilter === "all"} onClick={() => handleTypeChange("all")}>
          <ChipLabel active={typeFilter === "all"}>{translateText("All")}</ChipLabel>
          <ChipCount>({totalCount})</ChipCount>
        </TypeChip>

        <StarChip
          active={typeFilter === "favourites"}
          data-testid="earlyland-fav-star"
          onClick={() => handleTypeChange(typeFilter === "favourites" ? "all" : "favourites")}
          title={translateText("Favourites")}
        >
          <StarIcon
            variant={typeFilter === "favourites" || favouritesCount > 0 ? undefined : "outlined"}
            fill={typeFilter === "favourites" || favouritesCount > 0 ? "#f5a623" : "#728094"}
          />
          {favouritesCount > 0 && <ChipCount>({favouritesCount})</ChipCount>}
        </StarChip>

        {typeOptions.map(({ value, label, count }) => (
          <TypeChip
            key={value}
            active={typeFilter === value}
            onClick={() => handleTypeChange(value)}
          >
            <ChipLabel active={typeFilter === value}>{translateText(label)}</ChipLabel>
            {count !== undefined && <ChipCount>({count})</ChipCount>}
          </TypeChip>
        ))}

        <TypeChip active={typeFilter === "others"} onClick={() => handleTypeChange("others")}>
          <ChipLabel active={typeFilter === "others"}>{translateText("Others")}</ChipLabel>
          <ChipCount>({othersCount})</ChipCount>
        </TypeChip>
      </LeftGroup>

      {/* Right: dropdowns + actions */}
      <RightGroup>
        <DropdownWrapper>
          <CustomDropdown
            options={STATUS_OPTIONS.map((option) => ({
              ...option,
              label: translateText(option.label),
            }))}
            value={statusFilter}
            onChange={handleStatusChange}
            placeholder={translateText("All Status")}
            searchable={false}
          />
        </DropdownWrapper>

        <DropdownWrapper>
          <CustomDropdown
            options={SORT_OPTIONS.map((option) => ({
              ...option,
              label: translateText(option.label),
            }))}
            value={sortFilter}
            onChange={handleSortChange}
            placeholder={translateText("Default")}
            searchable={false}
          />
        </DropdownWrapper>

        <FilterButton onClick={onFilterClick} style={filterActiveCount > 0 ? { borderColor: "#04a584", background: "#f5fbfd" } : undefined}>
          <FilterIcon width={16} color={filterActiveCount > 0 ? "#04a584" : "#738094"} />
          <span style={filterActiveCount > 0 ? { color: "#04a584" } : undefined}>
            {translateText("Filter")}{filterActiveCount > 0 ? ` (${filterActiveCount})` : ""}
          </span>
        </FilterButton>

        <IconButton onClick={onCalendarClick} title={translateText("Calendar")}>
          <CalendarIcon fill="#070b35" />
        </IconButton>
      </RightGroup>
    </FilterBarWrapper>
  );
};

export default FeedFilterBar;
