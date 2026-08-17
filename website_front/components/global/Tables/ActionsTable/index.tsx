import React, { FC } from "react";
import ProjectTable, { ProjectTableInterface } from "./ProjectsTable";
import AssetTable, { AssetTableInterface } from "./AssetTable";

export interface ViewTableInterface {
  type: "project" | "asset";
  cardsData: ProjectTableInterface | AssetTableInterface;
}

const ActionsTable: FC<ViewTableInterface> = ({ type, cardsData }) => {
  switch (type) {
    case "project":
      // @ts-ignore
      return <ProjectTable {...cardsData} />;
    case "asset":
      // @ts-ignore
      return <AssetTable {...cardsData} />;
    default:
      return null;
  }
};

export default ActionsTable;
