import React from "react";
import { BarChart3, Table2 } from "lucide-react";
import UniversalFilter from "../../../global/UniversalFilter";
import { SortIcon } from "../../../global/Icons";
import SortDropdown from "../../../global/common/SortDropdown";
import { TableGridBtn } from "../Persons/styles";
import type { BackersSortOption, BackersTab } from "./hooks";
import {
  BackersContentModeActions,
  BackersContentModeButton,
  BackersHeaderActions,
  BackersHeaderIconActions,
} from "./styles";

type BackersContentMode = "analytics" | "table";

interface IBackersActionsBarProps {
  activeQuickFilter: string;
  activeSortOptions: BackersSortOption[];
  activeTab: BackersTab;
  fundsFilter: any;
  mode: BackersContentMode;
  onFundsFilterChange: (data: any) => void;
  onFundsFilterReset: () => void;
  onModeChange: (nextMode: BackersContentMode) => void;
  onPersonsFilterChange: (data: any) => void;
  onPersonsFilterReset: () => void;
  onQuickFilterChange: (value: string) => void;
  personsFilter: any;
  personsGrid: boolean;
  setPersonsGrid: React.Dispatch<React.SetStateAction<boolean>>;
  showPersonsViewMode: boolean;
  translateText: (value: string) => string;
}

const ViewModeButtons = ({
  grid,
  setGrid,
}: {
  grid: boolean;
  setGrid: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <BackersHeaderIconActions className="backers-action-group">
      <TableGridBtn
        type="button"
        style={{ display: "flex" }}
        onClick={() => setGrid(true)}
        isActive={grid}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M15.8333 2.5C16.7538 2.5 17.5 3.23597 17.5 4.14383L17.5 6.94994C17.5 7.8578 16.7538 8.59377 15.8333 8.59377H13.3333C12.4129 8.59377 11.6667 7.8578 11.6667 6.94994L11.6667 4.14383C11.6667 3.23597 12.4129 2.5 13.3333 2.5L15.8333 2.5Z"
            stroke="#04A584"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.16667 2.5C3.24619 2.5 2.5 3.23597 2.5 4.14383L2.50001 6.94994C2.50001 7.8578 3.2462 8.59377 4.16667 8.59377H6.66667C7.58715 8.59377 8.33334 7.8578 8.33334 6.94994L8.33333 4.14383C8.33333 3.23597 7.58714 2.5 6.66667 2.5L4.16667 2.5Z"
            stroke="#04A584"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.8333 11.4063C16.7538 11.4063 17.5 12.1422 17.5 13.0501V15.8562C17.5 16.764 16.7538 17.5 15.8333 17.5H13.3333C12.4129 17.5 11.6667 16.764 11.6667 15.8562L11.6667 13.0501C11.6667 12.1422 12.4129 11.4063 13.3333 11.4063H15.8333Z"
            stroke="#04A584"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.16667 11.4063C3.2462 11.4063 2.50001 12.1422 2.50001 13.0501L2.50001 15.8562C2.50001 16.764 3.2462 17.5 4.16668 17.5H6.66667C7.58715 17.5 8.33334 16.764 8.33334 15.8562L8.33334 13.0501C8.33334 12.1422 7.58715 11.4063 6.66667 11.4063H4.16667Z"
            stroke="#04A584"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </TableGridBtn>
      <TableGridBtn type="button" onClick={() => setGrid(false)} isActive={!grid}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M2.88491 12.517H17.5M2.88491 7.50849H17.5M15.6504 17.5H4.11851C3.22463 17.5 2.5 16.764 2.5 15.8562L2.5 4.14384C2.5 3.23597 3.22463 2.5 4.11851 2.5L15.6504 2.5C16.5443 2.5 17.2689 3.23597 17.2689 4.14384V15.8562C17.2689 16.764 16.5443 17.5 15.6504 17.5Z"
            stroke="#738094"
          />
        </svg>
      </TableGridBtn>
    </BackersHeaderIconActions>
  );
};

const ContentModeButtons = ({
  mode,
  onChange,
}: {
  mode: BackersContentMode;
  onChange: (nextMode: BackersContentMode) => void;
}) => {
  return (
    <BackersContentModeActions className="backers-action-group">
      <BackersContentModeButton
        type="button"
        isActive={mode === "table"}
        onClick={() => onChange("table")}
      >
        <Table2 size={18} />
      </BackersContentModeButton>
      <BackersContentModeButton
        type="button"
        isActive={mode === "analytics"}
        onClick={() => onChange("analytics")}
      >
        <BarChart3 size={18} />
      </BackersContentModeButton>
    </BackersContentModeActions>
  );
};

const BackersActionsBar = ({
  activeQuickFilter,
  activeSortOptions,
  activeTab,
  fundsFilter,
  mode,
  onFundsFilterChange,
  onFundsFilterReset,
  onModeChange,
  onPersonsFilterChange,
  onPersonsFilterReset,
  onQuickFilterChange,
  personsFilter,
  personsGrid,
  setPersonsGrid,
  showPersonsViewMode,
}: IBackersActionsBarProps) => {
  if (activeTab === "Ecosystem") return null;

  return (
    <BackersHeaderActions>
      <ContentModeButtons mode={mode} onChange={onModeChange} />
      <SortDropdown
        className="backers-sort-dropdown"
        value={activeQuickFilter}
        options={activeSortOptions}
        onChange={onQuickFilterChange}
        icon={<SortIcon />}
      />
      <div className="header-filter">
        {activeTab === "Funds" ? (
          <UniversalFilter
            filters={fundsFilter}
            onChange={onFundsFilterChange}
            onReset={onFundsFilterReset}
          />
        ) : (
          <UniversalFilter
            filters={personsFilter}
            onChange={onPersonsFilterChange}
            onReset={onPersonsFilterReset}
          />
        )}
      </div>
      {showPersonsViewMode ? (
        <ViewModeButtons grid={personsGrid} setGrid={setPersonsGrid} />
      ) : null}
    </BackersHeaderActions>
  );
};

export default BackersActionsBar;
