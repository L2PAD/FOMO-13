import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useFavorites } from "../../../../hooks/useFavourite";
import { useScrollHandler } from "../../../../hooks/useScrollHandler";
import ArrowIcon from "../../../../assets/icons/left-arrow.svg";
import { ScrollButton, TableWrapper } from "./styles";
import UniversalTableHeader from "./UniversalTableHeader";
import UniversalTableRows from "./UniversalTableRows";
import UniversalTableContent, {
  formatPercent,
} from "./UniversalTableContent";
import { ICustomTableColumn, ISortHeaderItem, TableTypes } from "./types";

interface IProps {
  isFavorite?: boolean;
  setIsFavorite?: any;
  isLoading: boolean;
  page: number;
  items: Array<any>;
  sortValue: { name: string; value: 1 | -1 } | undefined;
  gridColumns: string;
  link: string;
  favKey: string;
  sortHeaders: Array<ISortHeaderItem>;
  type?: TableTypes;
  updateSortValue?: (name: string, value: 1 | -1) => void;
  keys?: string[];
  customColumns?: Array<ICustomTableColumn>;
  isFavButton?: boolean;
  minWidth?: number;
  className?: string;
  onFollowersClick?: (
    type: "followers" | "following",
    data: any[],
    accountName: string
  ) => void;
  onFundingFeedInvestorsClick?: (investors: any[], round: any) => void;
  onBackerProjectsClick?: (backer: any) => void;
  influenceFilter?: string;
  forcedFavorites?: Array<any>;
  searchValue?: string;
}

const UniversalTable: FC<IProps> = ({
  isFavorite,
  isLoading,
  page,
  sortValue,
  setIsFavorite,
  items,
  gridColumns,
  link,
  favKey,
  sortHeaders,
  type = "crypto",
  updateSortValue,
  customColumns,
  isFavButton = true,
  minWidth = 1000,
  className,
  onFollowersClick,
  onFundingFeedInvestorsClick,
  onBackerProjectsClick,
  influenceFilter,
  forcedFavorites = [],
  searchValue = "",
}) => {
  const { showScrollButton, scrollToTop } = useScrollHandler({
    projectsLength: items.length,
  });
  const { favorites, toggleFavorite } = useFavorites(favKey, forcedFavorites);
  const renderedItems = useMemo(
    () => (isFavorite ? favorites : items),
    [isFavorite, favorites, items]
  );
  const [visibleCount, setVisibleCount] = useState(10);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [lastElement, setLastElement] = useState<HTMLElement | null>(null);

  const lastItemRef = (node: HTMLElement | null) => {
    setLastElement(node);
  };

  const loadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const getTableRow = (item: any) => {
    return (
      <UniversalTableContent
        item={item}
        type={type}
        customColumns={customColumns}
        onFollowersClick={onFollowersClick}
        onFundingFeedInvestorsClick={onFundingFeedInvestorsClick}
        onBackerProjectsClick={onBackerProjectsClick}
        searchValue={searchValue}
      />
    );
  };

  useEffect(() => {
    if (!lastElement) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1 }
    );

    observerRef.current.observe(lastElement);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [lastElement, visibleCount]);

  return (
    <TableWrapper className={className}>
      <UniversalTableHeader
        className={className}
        gridColumns={gridColumns}
        isFavButton={isFavButton}
        isFavorite={isFavorite}
        minWidth={minWidth}
        setIsFavorite={setIsFavorite}
        sortHeaders={sortHeaders}
        sortValue={sortValue}
        type={type}
        updateSortValue={updateSortValue}
      />
      <UniversalTableRows
        className={className}
        favorites={favorites}
        getTableRow={getTableRow}
        gridColumns={gridColumns}
        isFavButton={isFavButton}
        isLoading={isLoading}
        lastItemRef={lastItemRef}
        link={link}
        minWidth={minWidth}
        page={page}
        renderedItems={renderedItems}
        toggleFavorite={toggleFavorite}
        type={type}
        visibleCount={visibleCount}
      />
      {showScrollButton ? (
        <ScrollButton onClick={scrollToTop}>
          <Image src={ArrowIcon} alt="arrow top" />
        </ScrollButton>
      ) : (
        <></>
      )}
    </TableWrapper>
  );
};

export { formatPercent };

export default UniversalTable;
