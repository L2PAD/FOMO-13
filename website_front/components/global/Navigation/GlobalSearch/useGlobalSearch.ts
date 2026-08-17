import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import fetchSearch from "../../../../http/search/fetchSearch";
import { useDebounce } from "../../../../hooks/useDebounce";

export const useGlobalSearch = () => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState<string>("");
  const [isSearchModal, setIsSearchModal] = useState<boolean>(false);
  const debouncedSearchValue = useDebounce<string>(searchValue, 500);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const { data, isLoading: isSearchLoading } = useQuery(
    ["searchResults", debouncedSearchValue],
    () => fetchSearch(debouncedSearchValue),
    {
      enabled: debouncedSearchValue.trim() !== "",
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
    }
  );

  const closeSearch = useCallback(() => {
    setIsSearchModal(false);
    setSearchValue("");
  }, []);

  const handleSearchFocus = useCallback((value: boolean) => {
    if (value) {
      setIsSearchModal(true);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target as Node)
      ) {
        closeSearch();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeSearch]);

  useEffect(() => {
    router.events.on("routeChangeStart", closeSearch);

    return () => router.events.off("routeChangeStart", closeSearch);
  }, [closeSearch, router.events]);

  return {
    data,
    isSearchLoading,
    isSearchModal,
    searchValue,
    searchWrapperRef,
    closeSearch,
    handleSearchFocus,
    setSearchValue,
  };
};
