/* eslint-disable */
import React, { FC } from "react";
import ProjectTable, { ProjectTableInterface } from "./ProjectTable";
import FundTable, { FundTableInterface } from "./FundTable";
import NFTsTable, { NFTsTableInterface } from "./NTFsTable";
import EarlyLandTable from "./EarlyLandTable";
import GemsLabTable, { GemsLabTableInterface } from "./GemsLabTable";
import ExchangeTable, { ExchangeTableInterface } from "./ExchangesTable";
import AssetTable, { AssetTableInterface } from "./AssetTable";
import EventTable, { EventTableInterface } from "./EventTable";
import TaskTable from "./TaskTable";
import WatchlistTable, { WatchlistTableInterface } from "./WatchlistTable";
import {
  IEvent,
  IPerson,
  IProject,
  ITask,
} from "../../../../types/global_types";

export interface ViewTableInterface {
  type:
    | "project"
    | "fund"
    | "nft"
    | "watchlist"
    | "persons"
    | "earlyLand"
    | "gemslab"
    | "exchange"
    | "asset"
    | "event"
    | "projects"
    | "funds"
    | "persons"
    | "nfts"
    | "tasks"
    | string;
  cardsData:
    | ProjectTableInterface
    | FundTableInterface
    | NFTsTableInterface
    | WatchlistTableInterface
    | GemsLabTableInterface
    | ExchangeTableInterface
    | AssetTableInterface
    | EventTableInterface
    | Array<{ date: Date; events: Array<IEvent> }>
    | Array<{ date: Date; events: Array<ITask> }>
    | IPerson
    | any;
  openTaskDetails?: (item: ITask) => void;
}

const ViewTable: FC<ViewTableInterface> = ({
  type,
  cardsData,
  openTaskDetails,
}) => {
  switch (type) {
    case "project":
      // @ts-ignore
      return <ProjectTable {...cardsData} />;
    case "projects":
      // @ts-ignore
      return <ProjectTable {...cardsData} />;
    case "fund":
      // @ts-ignore
      return <FundTable {...cardsData} />;
    case "funds":
      // @ts-ignore
      return <FundTable {...cardsData} />;
    case "persons":
      // @ts-ignore
      return <FundTable {...cardsData} />;
    case "nft":
      // @ts-ignore
      return <NFTsTable {...cardsData} />;
    case "watchlist":
      // @ts-ignore
      return <WatchlistTable cards={cardsData.cards} />;
    case "earlyLand":
      // @ts-ignore
      return <EarlyLandTable {...cardsData} />;
    case "gemslab":
      // @ts-ignore
      return <GemsLabTable {...cardsData} />;
    case "exchange":
      //@ts-ignore
      return <ExchangeTable {...cardsData} />;
    case "asset":
      //@ts-ignore
      return <AssetTable {...cardsData} />;
    case "event":
      //@ts-ignore
      return <EventTable events={cardsData} />;
    case "tasks":
      return <TaskTable openTaskDetails={openTaskDetails} tasks={cardsData} />;
    default:
      return null;
  }
};

export default ViewTable;
