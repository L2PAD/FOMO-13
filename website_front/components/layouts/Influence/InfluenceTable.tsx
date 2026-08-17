import React from "react";
import UniversalTable from "../../global/common/UniversalTable";
import Pagination from "../../global/Pagintaion";
import {
  TableWrapper,
  TableTitle,
  EntityAvatar,
  EntityName,
  RelationsLabel,
} from "../projects/Influence/styles";

interface InfluenceTableProps {
  selectedEntity: any;
  influenceData: any[];
  socialNetwork: string;
  dateRange: {
    start: Date;
    end: Date;
  };
}

const InfluenceTable: React.FC<InfluenceTableProps> = ({
  selectedEntity,
  influenceData,
  socialNetwork,
  dateRange,
}) => {
  const totalRelations = influenceData.length;

  const socialNetworkLabelMap: { [key: string]: string } = {
    x: "X",
    linkedin: "LinkedIn",
    threads: "Threads",
    telegram: "Telegram",
    discord: "Discord",
  };

  // Define columns based on social network
  const columnsConfigs: Record<
    string,
    {
      gridColumns: string;
      headers: { label: string }[];
      type:
        | "influence-x"
        | "influence-linkedin"
        | "influence-threads"
        | "influence-telegram"
        | "influence-discord"
        | "influence-instagram"
        | "influence-tiktok";
    }
  > = {
    x: {
      gridColumns: "0.2fr 0.15fr 0.15fr 0.15fr 0.15fr 0.2fr",
      headers: [
        { label: "Account" },
        { label: "Followers" },
        { label: "Following" },
        { label: "Audience Intersection" },
        { label: "Engagement Rate" },
        { label: "X Score" },
      ],
      type: "influence-x",
    },
    linkedin: {
      gridColumns: "0.25fr 0.15fr 0.2fr 0.2fr 0.2fr",
      headers: [
        { label: "Entity" },
        { label: "Type" },
        { label: "Company Size" },
        { label: "Public Followers" },
        { label: "Mutual Connections" },
      ],
      type: "influence-linkedin",
    },
    threads: {
      gridColumns: "0.2fr 0.15fr 0.15fr 0.15fr 0.15fr 0.2fr",
      headers: [
        { label: "Account" },
        { label: "Followers" },
        { label: "Following" },
        { label: "Posts/Week" },
        { label: "Avg Likes" },
        { label: "Avg Replies" },
      ],
      type: "influence-threads",
    },
    telegram: {
      gridColumns: "0.25fr 0.2fr 0.2fr 0.2fr 0.15fr",
      headers: [
        { label: "Channel" },
        { label: "Members" },
        { label: "Growth (30d)" },
        { label: "Posts/Week" },
        { label: "Total Posts" },
      ],
      type: "influence-telegram",
    },
    discord: {
      gridColumns: "0.25fr 0.2fr 0.2fr 0.15fr 0.2fr",
      headers: [
        { label: "Server" },
        { label: "Members" },
        { label: "Engagement Rate" },
        { label: "Impressions" },
        { label: "Reach" },
      ],
      type: "influence-discord",
    },
    instagram: {
      gridColumns: "0.2fr 0.15fr 0.2fr 0.2fr 0.25fr",
      headers: [
        { label: "Account" },
        { label: "Followers" },
        { label: "Avg Views" },
        { label: "Engagement Rate" },
        { label: "Post Freq" },
      ],
      type: "influence-instagram",
    },
    tiktok: {
      gridColumns: "0.2fr 0.15fr 0.15fr 0.15fr 0.15fr 0.2fr",
      headers: [
        { label: "Account" },
        { label: "Followers" },
        { label: "Following" },
        { label: "Posts/Week" },
        { label: "Avg Likes" },
        { label: "Avg Replies" },
      ],
      type: "influence-tiktok",
    },
  };

  const columnsConfig = columnsConfigs[socialNetwork] || columnsConfigs.x;

  return (
    <TableWrapper>
      <TableTitle>
        <EntityName>Relations</EntityName>
        <EntityAvatar
          src={selectedEntity.logo || "/static/projects/avatar1.jpg"}
          alt={selectedEntity.name}
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            e.currentTarget.src = "/static/projects/avatar1.jpg";
          }}
        />
        <RelationsLabel>{selectedEntity.name}</RelationsLabel>
      </TableTitle>
      <UniversalTable
        isLoading={false}
        page={1}
        items={influenceData}
        sortValue={undefined}
        gridColumns={columnsConfig.gridColumns}
        link=""
        favKey={`influence-${socialNetwork}`}
        sortHeaders={columnsConfig.headers}
        type={columnsConfig.type}
        isFavButton={false}
        minWidth={1000}
        className="influence"
        influenceFilter={socialNetwork}
      />
      <Pagination
        totalPage={10}
        page={1}
        onChange={() => {}}
        limit={10}
        total={totalRelations}
      />
    </TableWrapper>
  );
};

export default InfluenceTable;
