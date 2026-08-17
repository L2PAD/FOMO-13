import { useMemo } from "react";

interface SortItem {
  name: string;
  lastFunding: Date;
}

type SortField = keyof SortItem;
type SortOrder = "asc" | "desc";

export interface ISortBy {
  field: keyof SortItem;
  order: SortOrder;
}

const useSort = (sortBy: SortField, order: SortOrder = "asc") => {
  const sortProjects = useMemo(() => {
    return (a: SortItem, b: SortItem) => {
      const aValue = sortBy === "lastFunding" ? new Date(a[sortBy]) : a[sortBy];
      const bValue = sortBy === "lastFunding" ? new Date(b[sortBy]) : b[sortBy];

      if (aValue < bValue) {
        return order === "asc" ? -1 : 1;
      } else if (aValue > bValue) {
        return order === "asc" ? 1 : -1;
      }
      return 0;
    };
  }, [sortBy, order]);

  return sortProjects;
};

export default useSort;
