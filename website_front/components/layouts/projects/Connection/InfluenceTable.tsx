import React, { useState } from "react";
import UniversalTable from "../../../global/common/UniversalTable";
import Pagination from "../../../global/Pagintaion";
import FollowersModal from "./FollowersModal";
import {
  TableSection,
  TableContentWrapper,
  TableWrapper,
  TableTitle,
  EntityAvatar,
  EntityName,
  RelationsLabel,
} from "./styles";

interface InfluenceTableProps {
  selectedEntity: any;
  influenceRelationsData: any[];
  influenceFilter: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  hopLevel: number;
}

const InfluenceTable: React.FC<InfluenceTableProps> = ({
  selectedEntity,
  influenceRelationsData,
  influenceFilter,
  dateRange,
  hopLevel,
}) => {
  // Calculate real metrics from influence data
  const totalRelations = influenceRelationsData.length;
  const activeRelations = totalRelations; // All influence relations are considered active
  // Network reach calculations using real hop level from graph
  // Invert: as we go deeper (hopLevel increases), remaining hops decrease
  const networkHops = 4 - hopLevel; // hopLevel 1 -> 3 hops, hopLevel 2 -> 2 hops, hopLevel 3 -> 1 hop
  const reachableEntities = totalRelations * (networkHops + 1) * 8;

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "followers" | "following";
    data: any[];
    title: string;
    totalCount: string;
  }>({ isOpen: false, type: "followers", data: [], title: "", totalCount: "" });

  const handleOpenModal = (
    type: "followers" | "following",
    data: any[],
    accountName: string
  ) => {
    // Get the total count from the current item
    const totalCount =
      type === "followers"
        ? influenceRelationsData.find((item) => item.account === accountName)
            ?.followers || "0"
        : influenceRelationsData.find((item) => item.account === accountName)
            ?.following || "0";

    setModalState({
      isOpen: true,
      type,
      data,
      title: accountName,
      totalCount,
    });
  };

  const handleCloseModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  const influenceFilterLabelMap: { [key: string]: string } = {
    x: "X",
    tg: "Telegram",
    ds: "Discord",
    inst: "Instagram",
    link: "LinkedIn",
    tiktok: "TikTok",
    threads: "Threads",
  };

  return (
    <TableSection>
      <TableContentWrapper>
        <TableWrapper>
          <TableTitle>
            <EntityName>Relations</EntityName>
            <EntityAvatar
              src={selectedEntity.logo || "/static/projects/avatar1.jpg"}
              alt={selectedEntity.name}
              onError={(e) => {
                e.currentTarget.src = "/static/projects/avatar1.jpg";
              }}
            />
            <RelationsLabel>{selectedEntity.name}</RelationsLabel>
          </TableTitle>
          <UniversalTable
            isLoading={false}
            page={1}
            items={influenceRelationsData}
            sortValue={undefined}
            gridColumns={
              influenceFilter === "link"
                ? "0.25fr 0.15fr 0.2fr 0.2fr 0.2fr"
                : influenceFilter === "threads"
                  ? "0.18fr 0.16fr 0.16fr 0.15fr 0.15fr 0.2fr"
                  : "0.18fr 0.16fr 0.16fr 0.15fr 0.15fr 0.2fr"
            }
            link=""
            favKey="influence-relations"
            sortHeaders={
              influenceFilter === "link"
                ? [
                    { label: "Entity" },
                    { label: "Type" },
                    { label: "Company Size" },
                    { label: "Public Followers" },
                    { label: "Mutual Connections" },
                  ]
                : influenceFilter === "threads"
                  ? [
                      { label: "Account" },
                      { label: "Followers" },
                      { label: "Following" },
                      { label: "Posts/Week" },
                      { label: "Avg Likes" },
                      { label: "Avg Replies" },
                    ]
                  : [
                      { label: "Account" },
                      { label: "Followers" },
                      { label: "Following" },
                      { label: "Audience Intersection" },
                      { label: "Engagement Rate" },
                      {
                        label: `${influenceFilterLabelMap[influenceFilter]} Score`,
                      },
                    ]
            }
            type={
              influenceFilter === "link"
                ? "influence-linkedin"
                : influenceFilter === "threads"
                  ? "influence-threads"
                  : "influence-relations"
            }
            isFavButton={false}
            minWidth={1000}
            className="influence"
            onFollowersClick={handleOpenModal}
            influenceFilter={influenceFilter}
          />
          <Pagination
            totalPage={10}
            page={1}
            onChange={() => {}}
            limit={10}
            total={totalRelations}
          />
        </TableWrapper>
      </TableContentWrapper>
      <FollowersModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        title={`${modalState.title} ${influenceFilterLabelMap[influenceFilter]} ${modalState.type === "followers" ? "Followers" : "Following"}`}
        totalCount={modalState.totalCount}
        followers={modalState.data}
      />
    </TableSection>
  );
};

export default InfluenceTable;
