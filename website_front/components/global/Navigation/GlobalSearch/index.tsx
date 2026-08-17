import React, { FC } from "react";
import {
  Search,
  SearchIconStyle,
  SearchWrapper,
} from "../styles";
import SearchResults from "../SearchProjectsResult";
import { useGlobalSearch } from "./useGlobalSearch";

interface Props {
  placeholder: string;
}

const GlobalSearch: FC<Props> = ({ placeholder }) => {
  const {
    data,
    isSearchLoading,
    isSearchModal,
    searchValue,
    searchWrapperRef,
    closeSearch,
    handleSearchFocus,
    setSearchValue,
  } = useGlobalSearch();

  return (
    <SearchWrapper ref={searchWrapperRef} open={isSearchModal}>
      <Search
        className="nav-search"
        onFocus={handleSearchFocus}
        type="text"
        placeholder={placeholder}
        onChange={(value: string) => setSearchValue(value)}
        leftIcon={<SearchIconStyle className="nav-icon" />}
        value={searchValue}
        open={isSearchModal}
      />

      <SearchResults
        isLoading={isSearchLoading}
        isVisible={isSearchModal}
        data={data?.results}
        onNavigate={closeSearch}
      />
    </SearchWrapper>
  );
};

export default GlobalSearch;
