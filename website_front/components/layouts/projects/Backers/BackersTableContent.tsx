import React, { useState } from "react";
import Pagination from "../../../global/Pagintaion";
import UniversalTable from "../../../global/common/UniversalTable";
import PlaceholderGrid from "../../../global/common/PlaceholderGrid";
import EmptyList from "../../../global/EmptyList";
import BackerProjectsModal from "./BackerProjectsModal";
import { EmptyListWrapper } from "../../earlyland/Board/styles";
import { HeaderPaginationWrapper } from "../CryptoMarket/styles";
import { ProjectsWrapper } from "../Crypto/styles";
import { CardLinkWrapper, CardWrapper } from "../Persons/styles";
import {
  backersFundsGridColumns,
  backersFundsSortHeader,
  backersPersonsSortHeader,
  personsGridColumns,
} from "../../../../staticContent/tables";
import {
  FUNDS_LIMIT,
  PERSONS_GRID_LIMIT,
  PERSONS_TABLE_LIMIT,
  type IFundsState,
  type IPersonsState,
} from "./hooks";
import { getBackerHref } from "../../../../helpers/backerRoute";

interface IFundsTableContentProps {
  fundsSection: IFundsState;
  sortedFunds: any[];
}

interface IPersonsTableContentProps {
  personsSection: IPersonsState;
  sortedPersons: any[];
}

export const FundsTableContent = ({
  fundsSection,
  sortedFunds,
}: IFundsTableContentProps) => {
  const [selectedFund, setSelectedFund] = useState<any | null>(null);

  return (
    <>
      <HeaderPaginationWrapper id="scroll-header">
        {Number(fundsSection.data?.total) > FUNDS_LIMIT && !fundsSection.isFavorite ? (
          <Pagination
            page={fundsSection.page}
            total={Number(fundsSection.data?.total)}
            limit={
              Number(fundsSection.data?.total) < fundsSection.page * FUNDS_LIMIT
                ? fundsSection.data?.total
                : fundsSection.page * FUNDS_LIMIT
            }
            totalPage={Math.ceil(Number(fundsSection.data?.total) / FUNDS_LIMIT)}
            onChange={(value) => {
              fundsSection.setPage(value);
            }}
          />
        ) : null}
        <UniversalTable
          type="backers-funds"
          sortHeaders={backersFundsSortHeader}
          link="/crypto/funds"
          favKey="FOMO-CRYPTO-MARKET-FAV"
          gridColumns={backersFundsGridColumns}
          isFavorite={fundsSection.isFavorite}
          setIsFavorite={fundsSection.setIsFavorite}
          isLoading={fundsSection.isLoading}
          sortValue={fundsSection.sortValue}
          updateSortValue={fundsSection.updateSortValue}
          page={fundsSection.page}
          items={sortedFunds}
          minWidth={1280}
          searchValue={fundsSection.searchValue}
          onBackerProjectsClick={(fund) => setSelectedFund(fund)}
        />
        {Number(fundsSection.data?.total) > FUNDS_LIMIT && !fundsSection.isFavorite ? (
          <Pagination
            page={fundsSection.page}
            total={Number(fundsSection.data?.total)}
            limit={
              Number(fundsSection.data?.total) < fundsSection.page * FUNDS_LIMIT
                ? fundsSection.data?.total
                : fundsSection.page * FUNDS_LIMIT
            }
            totalPage={Math.ceil(Number(fundsSection.data?.total) / FUNDS_LIMIT)}
            onChange={(value) => {
              fundsSection.setPage(value);
              document.querySelector("#scroll-header")?.scrollIntoView();
            }}
          />
        ) : null}
      </HeaderPaginationWrapper>
      <BackerProjectsModal
        backer={selectedFund}
        isVisible={Boolean(selectedFund)}
        onClose={() => setSelectedFund(null)}
      />
    </>
  );
};

export const PersonsTableContent = ({
  personsSection,
  sortedPersons,
}: IPersonsTableContentProps) => {
  const currentLimit = personsSection.grid
    ? PERSONS_GRID_LIMIT
    : PERSONS_TABLE_LIMIT;

  return (
    <>
      {personsSection.grid ? (
        personsSection.isLoading ? (
          <PlaceholderGrid mobileSingleColumn />
        ) : (
          <ProjectsWrapper>
            {sortedPersons.length
              ? sortedPersons.map((item: any) => {
                  const personHref = getBackerHref(item, "person");
                  const personKey = item.routeId || item.slug || item._id || item.id;

                  return (
                    <CardLinkWrapper href={personHref} key={personKey}>
                      <CardWrapper
                        {...item}
                        redFlagsList={item.redFlagsList}
                        banner={item.banner}
                        logo={String(item.logo)}
                        name={item.name}
                        rating={item.rating}
                        fullness={item.fullness}
                        niche={item.niche}
                        socialmedia={item.socialmedia}
                        regionData={item.regionData}
                        athRoi={item.athRoi}
                        totalInvested={
                          item.supportedProjectsCount ??
                          item.projectsCount ??
                          item.totalInvested
                        }
                        investmentsVariant="count"
                      />
                    </CardLinkWrapper>
                  );
                })
              : (
                  <EmptyListWrapper>
                    <EmptyList />
                  </EmptyListWrapper>
                )}
          </ProjectsWrapper>
        )
      ) : (
        <>
          {Number(personsSection.data?.total) > currentLimit &&
          !personsSection.isFavorite ? (
            <Pagination
              page={personsSection.page}
              onePageLimit={currentLimit}
              total={Number(personsSection.data?.total)}
              limit={
                Number(personsSection.data?.total) <
                personsSection.page * currentLimit
                  ? personsSection.data?.total
                  : personsSection.page * currentLimit
              }
              totalPage={Math.ceil(
                Number(personsSection.data?.total) / currentLimit
              )}
              onChange={(value) => {
                personsSection.setPage(value);
              }}
            />
          ) : null}
          <UniversalTable
            isFavorite={personsSection.isFavorite}
            setIsFavorite={personsSection.setIsFavorite}
            link="/crypto/persons"
            type="persons"
            favKey="FOMO-PERSONS-ICO-FAV"
            gridColumns={personsGridColumns}
            sortHeaders={backersPersonsSortHeader}
            updateSortValue={personsSection.updateSortValue}
            isLoading={personsSection.isLoading}
            sortValue={personsSection.sortValue}
            page={personsSection.page}
            items={sortedPersons}
            searchValue={personsSection.searchValue}
          />
        </>
      )}
      <HeaderPaginationWrapper id="scroll-header">
        {Number(personsSection.data?.total) > currentLimit &&
        !personsSection.isFavorite ? (
          <Pagination
            page={personsSection.page}
            onePageLimit={currentLimit}
            total={Number(personsSection.data?.total)}
            limit={
              Number(personsSection.data?.total) <
              personsSection.page * currentLimit
                ? personsSection.data?.total
                : personsSection.page * currentLimit
            }
            totalPage={Math.ceil(
              Number(personsSection.data?.total) / currentLimit
            )}
            onChange={(value) => {
              personsSection.setPage(value);
            }}
          />
        ) : null}
      </HeaderPaginationWrapper>
    </>
  );
};
