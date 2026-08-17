import React from "react";
import UniversalTable from "../../../global/common/UniversalTable";
import Pagination from "../../../global/Pagintaion";
import {
  TableWrapper,
  TableTitle,
  EntityAvatar,
  EntityName,
  RelationsLabel,
} from "./styles";

interface InfluenceTableProps {
  selectedEntity: any;
  influenceData: any[];
  socialNetwork: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  onFollowersClick?: (
    type: "followers" | "following",
    data: any[],
    accountName: string
  ) => void;
}

const InfluenceTable: React.FC<InfluenceTableProps> = ({
  selectedEntity,
  influenceData,
  socialNetwork,
  dateRange,
  onFollowersClick,
}) => {
  const totalRelations = influenceData.length;

  // 7 states based on screenshots
  const getTableConfig = () => {
    switch (socialNetwork) {
      case "x":
        // Screenshot 1: Account, Followers, Following, Growth (30d), ER, X Score, Red Flags, FOMO Score
        return {
          gridColumns: "0.25fr 0.15fr 0.15fr 0.1fr 0.1fr 0.25fr 90px 144px",
          headers: [
            { label: "Account" },
            { label: "Followers" },
            { label: "Following" },
            { label: "Growth (30d)" },
            { label: "ER" },
            { label: "X Score" },
            {
              label: "Red Flags",
              type: "div" as const,
              textAlign: "center" as const,
            },
            {
              label: "FOMO Score",
              type: "div" as const,
              textAlign: "right" as const,
            },
          ],
          type: "influence-x" as const,
        };

      case "threads":
        // Screenshot 2: Account, Followers, Following, Posts/Week, Avg Likes, Avg Replies, Red Flags, FOMO Score
        return {
          gridColumns: "0.25fr 0.15fr 0.15fr 0.1fr 0.1fr 0.25fr 90px 144px",
          headers: [
            { label: "Account" },
            { label: "Followers" },
            { label: "Following" },
            { label: "Posts/Week" },
            { label: "Avg Likes" },
            { label: "Avg Replies" },
            {
              label: "Red Flags",
              type: "div" as const,
              textAlign: "center" as const,
            },
            {
              label: "FOMO Score",
              type: "div" as const,
              textAlign: "right" as const,
            },
          ],
          type: "influence-threads" as const,
        };

      case "link":
        // Screenshot 3: Account, Type, Company Size, Public Followers, Red Flags, FOMO Score
        return {
          gridColumns: "0.25fr 0.25fr 0.2fr 0.25fr 90px 225px",
          headers: [
            { label: "Account" },
            { label: "Type" },
            { label: "Company Size" },
            { label: "Public Followers" },
            {
              label: "Red Flags",
              type: "div" as const,
              textAlign: "center" as const,
            },
            {
              label: "FOMO Score",
              type: "div" as const,
              textAlign: "right" as const,
            },
          ],
          type: "influence-linkedin" as const,
        };

      case "tiktok":
        // Screenshot 4: Account, Followers, Following, Posts/Month, Avg. Likes, ER, Growth (30d), Red Flags, FOMO Score
        return {
          gridColumns: "0.25fr 0.4fr 0.4fr 0.4fr 0.4fr",
          headers: [
            { label: "Account" },
            { label: "Followers" },
            { label: "Avg. Views" },
            { label: "Engagement Rate" },
            { label: "Post Freq" },
          ],
          type: "influence-tiktok" as const,
        };

      case "tg":
        // Screenshot 5: Channel/Group, Type, Members, Growth (7d), Activity, Red Flags, FOMO Score
        return {
          gridColumns: "0.3fr 0.2fr 0.2fr 0.2fr 0.2fr 0.25fr 90px 144px",
          headers: [
            { label: "Channel / Group" },
            { label: "Type" },
            { label: "Members" },
            { label: "Avg Reach" },
            { label: "Growth (7d)" },
            { label: "Activity" },
            {
              label: "Red Flags",
              type: "div" as const,
              textAlign: "center" as const,
            },
            {
              label: "FOMO Score",
              type: "div" as const,
              textAlign: "right" as const,
            },
          ],
          type: "influence-telegram" as const,
        };

      case "ds":
        // Screenshot 6: Server Name, Type, Members, Online Now, Engagement Level, Red Flags, FOMO Score
        return {
          gridColumns: "0.25fr 0.2fr 0.2fr 0.15fr 0.15fr 90px 144px",
          headers: [
            { label: "Server Name" },
            { label: "Type" },
            { label: "Members" },
            { label: "Online Now" },
            { label: "Engagement Level" },
            {
              label: "Red Flags",
              type: "div" as const,
              textAlign: "center" as const,
            },
            {
              label: "FOMO Score",
              type: "div" as const,
              textAlign: "right" as const,
            },
          ],
          type: "influence-discord" as const,
        };

      case "inst":
        // Screenshot 7: Account, Followers, Avg Views, Engagement Rate, Post Freq, Red Flags, FOMO Score
        return {
          gridColumns:
            "0.25fr 0.15fr 0.15fr 0.15fr 0.15fr 0.15fr 0.15fr 90px 144px",
          headers: [
            { label: "Account" },
            { label: "Followers" },
            { label: "Following" },
            { label: "Posts / Month" },
            { label: "Avg. Likes" },
            { label: "ER" },
            { label: "Growth (30d)" },
            {
              label: "Red Flags",
              type: "div" as const,
              textAlign: "center" as const,
            },
            {
              label: "FOMO Score",
              type: "div" as const,
              textAlign: "right" as const,
            },
          ],
          type: "influence-instagram" as const,
        };

      default:
        return {
          gridColumns: "0.25fr 0.15fr 0.15fr 0.1fr 0.1fr 0.25fr 90px 144px",
          headers: [
            { label: "Account" },
            { label: "Followers" },
            { label: "Following" },
            { label: "Growth (30d)" },
            { label: "ER" },
            { label: "X Score" },
            {
              label: "Red Flags",
              type: "div" as const,
              textAlign: "center" as const,
            },
            {
              label: "FOMO Score",
              type: "div" as const,
              textAlign: "right" as const,
            },
          ],
          type: "influence-x" as const,
        };
    }
  };

  const config = getTableConfig();

  // Generate link based on social network type
  const getEntityLink = () => {
    switch (socialNetwork) {
      case "x":
        return `/utility/influence/x`;
      case "threads":
        return `/utility/influence/threads`;
      case "link":
        return `/utility/influence/linkedin`;
      case "tiktok":
        return `/utility/influence/tiktok`;
      case "tg":
        return `/utility/influence/telegram`;
      case "ds":
        return `/utility/influence/discord`;
      case "inst":
        return `/utility/influence/instagram`;
      default:
        return `/utility/influence/entity`;
    }
  };

  return (
    <TableWrapper className="table-wrapper">
      <UniversalTable
        isLoading={false}
        page={1}
        items={influenceData}
        sortValue={undefined}
        gridColumns={config.gridColumns}
        link={getEntityLink()}
        favKey={`influence-${socialNetwork}`}
        sortHeaders={config.headers}
        type={config.type}
        isFavButton={false}
        minWidth={1000}
        className="influence-table"
        influenceFilter={socialNetwork}
        onFollowersClick={onFollowersClick}
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
