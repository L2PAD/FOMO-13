import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useRouter } from "next/router";
import { IOtcMember } from "../../../../../types/global_types";
import OtcMember from "../OtcMember";
import fetchDeals from "../../../../../http/otc/fetchDeals";
import OtcFilter from "../../../../global/Filter/otc_filter";
import OtcSearch from "../../../../global/Filter/otc_search";
import DealsBalanceComponent from "../../../../global/DealsBalanceComponent";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import { PageWrapper, PaginationWrapper } from "../styles";
import Pagination from "../../../../global/Pagintaion";
import {
  ContentWrapper,
  Content,
  TopMembersDescriptionWrapper,
  TopMembersHeaderControls,
  TopMembersHeaderLeft,
  TopMembersHeaderWrapper,
} from "./styles";
import { buildMembersQueryString } from "../../../../../utils/otcQueryBuilder";
import PlaceholderTable from "../../../../global/common/PlaceholderTable";
import EmptyList from "../../../../global/EmptyList";
import ShareModal from "../../../../global/modals/ShareModal";

export type TopMembersSortBy =
  | "deals-desc"
  | "purchases-desc"
  | "sales-desc"
  | "all";

const TopMembers = () => {
  const router = useRouter();
  const PAGE_SIZE = 5;
  const [page, setPage] = useState<number>(1);
  const [filters, setFilters] = useState<any>(null);
  const [searchValue, setSearchValue] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [sortByMembers] = useState<TopMembersSortBy>("all");
  const [isDescriptionsVisible, setIsDescriptionsVisible] =
    useState<boolean>(false);
  const [isSearch, setIsSearch] = useState<boolean>(false);
  const [shareModal, setShareModal] = useState<boolean>(false);
  const [memberData, setMemberData] = useState<IOtcMember | null>(null);
  const memberIdFromQuery =
    (router.query?.id as string | undefined) || undefined;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  const queryString = useMemo(
    () =>
      buildMembersQueryString(
        {
          ...(filters || {}),
          ...(memberIdFromQuery ? { memberId: memberIdFromQuery } : {}),
          searchValue: debouncedSearch || undefined,
        },
        sortByMembers,
        PAGE_SIZE,
        (page - 1) * PAGE_SIZE
      ),
    [filters, memberIdFromQuery, debouncedSearch, sortByMembers, page]
  );

  const { isLoading, data } = useQuery(
    ["deals", "Top users", queryString],
    () => fetchDeals("all/members", queryString),
    {
      refetchOnWindowFocus: false,
    }
  );

  const items: Array<IOtcMember> = data?.deals ? (data.deals as Array<any>) : [];
  const total = data?.total || 0;

  const handlePaginationChange = (value: number) => {
    document.querySelector("#otc-nav-wrapper")?.scrollIntoView();
    setPage(value);
  };

  const headerControls = (
    <TopMembersHeaderControls>
      <div className="top-members-search">
        <OtcSearch
          isSearch={isSearch}
          setIsSearch={setIsSearch}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
      </div>
      <div className="top-members-filter">
        <OtcFilter
          variant="small"
          filterDataInitial={filters}
          onSave={(filtersData: any) => setFilters(filtersData)}
          onReset={() => setFilters(null)}
        />
      </div>
      <div className="top-members-balance">
        <DealsBalanceComponent className="top-members-balance-buttons" />
      </div>
    </TopMembersHeaderControls>
  );

  const headerLeft = (
    <TopMembersHeaderLeft>
      <button
        onMouseEnter={() => setIsDescriptionsVisible(true)}
        onMouseLeave={() => setIsDescriptionsVisible(false)}
        className="info-button"
        aria-label="Top Members info"
      >
        <InfoIcon />
      </button>
      <TopMembersDescriptionWrapper>
        <div className="title-row">
          <h2>Top Members</h2>
          <span className="members-count">{total} members</span>
        </div>
        <p className="subtitle">
          Ranking of the most active and trusted OTC/P2P participants on FOMO.
        </p>
        <DescriptionComponent
          isDate={false}
          date={new Date()}
          isVisible={isDescriptionsVisible}
          className="gray-description"
          text={`
            A ranking of the most active and trusted OTC/P2P participants on FOMO.<br/>
            Here you can quickly find strong profiles by deal count, sales, purchases, and reputation signals.
          `}
        />
      </TopMembersDescriptionWrapper>
    </TopMembersHeaderLeft>
  );

  const pagination = () => (
    <PaginationWrapper>
      <Pagination
        page={page}
        total={total}
        limit={(page - 1) * PAGE_SIZE + items.length}
        totalPage={Math.ceil(total / PAGE_SIZE)}
        onChange={handlePaginationChange}
      />
    </PaginationWrapper>
  );

  if (isLoading) {
    return (
      <PageWrapper>
        <TopMembersHeaderWrapper>
          {headerLeft}
          {headerControls}
        </TopMembersHeaderWrapper>
        <PlaceholderTable height="201px" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <TopMembersHeaderWrapper>
        {headerLeft}
        {headerControls}
      </TopMembersHeaderWrapper>
      <Content>
        {total > PAGE_SIZE ? pagination() : <></>}
        <ContentWrapper>
          {items.length ? (
            items.map((item: IOtcMember) => (
              <OtcMember
                key={item._id}
                item={item}
                onShare={(member: IOtcMember) => {
                  setMemberData(member);
                  setShareModal(true);
                }}
              />
            ))
          ) : (
            <EmptyList gap={20} />
          )}
        </ContentWrapper>
        {total > PAGE_SIZE ? pagination() : <></>}
        <ShareModal
          activeTab="top-members"
          type="member"
          data={memberData}
          onClose={() => setShareModal(false)}
          link={``}
          isVisible={shareModal}
        />
      </Content>
    </PageWrapper>
  );
};

export default TopMembers;
