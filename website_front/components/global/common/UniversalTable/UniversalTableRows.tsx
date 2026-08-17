import React, { FC, ReactNode } from "react";
import PlaceholderTable from "../PlaceholderTable";
import UniversalTableRow from "../UniversalTableRow";
import EmptyList from "../../EmptyList";
import { EmptyListWrapper } from "../../../layouts/earlyland/Board/styles";
import {
  fundingFeedGridRowColumns,
  projectsIcoGridRowColumns,
} from "../../../../staticContent/tables";
import { RowsWrapper } from "./styles";
import { TableTypes } from "./types";

interface IProps {
  className?: string;
  favorites: Array<any>;
  getTableRow: (item: any) => ReactNode;
  gridColumns: string;
  isFavButton: boolean;
  isLoading: boolean;
  lastItemRef: (node: HTMLElement | null) => void;
  link: string;
  minWidth: number;
  page: number;
  renderedItems: Array<any>;
  toggleFavorite: (item: any) => void;
  type: TableTypes;
  visibleCount: number;
}

const UniversalTableRows: FC<IProps> = ({
  className,
  favorites,
  getTableRow,
  gridColumns,
  isFavButton,
  isLoading,
  lastItemRef,
  link,
  minWidth,
  page,
  renderedItems,
  toggleFavorite,
  type,
  visibleCount,
}) => {
  return (
    <RowsWrapper minWidth={minWidth} className="universal-table-rows-wrapper">
      {!isLoading ? (
        renderedItems.length ? (
          <>
            {renderedItems.slice(0, visibleCount).map((item: any, i: number) => {
              return (
                <UniversalTableRow
                  key={item._id}
                  isFavButton={isFavButton}
                  number={i + 1 + (page - 1) * 100}
                  item={item}
                  isFavorite={!!favorites.find((fv: any) => fv._id === item._id)}
                  toggleFavorite={() => toggleFavorite(item)}
                  gridColumns={
                    type !== "funding-feed"
                      ? type === "projects-ico"
                        ? projectsIcoGridRowColumns
                        : gridColumns
                      : fundingFeedGridRowColumns
                  }
                  link={link}
                  type={type}
                  className={className}
                >
                  {getTableRow(item)}
                </UniversalTableRow>
              );
            })}
            {visibleCount < renderedItems.length && <div ref={lastItemRef} />}
          </>
        ) : (
          <EmptyListWrapper>
            <EmptyList />
          </EmptyListWrapper>
        )
      ) : (
        <PlaceholderTable />
      )}
    </RowsWrapper>
  );
};

export default UniversalTableRows;
