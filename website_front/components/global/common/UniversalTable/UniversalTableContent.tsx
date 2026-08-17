import React, { FC, useContext } from "react";
import { AuthContext } from "../../Layout";
import { ICustomTableColumn, TableTypes } from "./types";
import { tableContentComponents } from "./components";
import { formatPercent, type UniversalTableCaseProps } from "./components/shared";

interface IProps {
  item: any;
  type: TableTypes;
  customColumns?: Array<ICustomTableColumn>;
  onFollowersClick?: (
    type: "followers" | "following",
    data: any[],
    accountName: string
  ) => void;
  onFundingFeedInvestorsClick?: (investors: any[], round: any) => void;
  onBackerProjectsClick?: (backer: any) => void;
  searchValue?: string;
}

const UniversalTableContent: FC<IProps> = ({
  item,
  type,
  customColumns,
  onFollowersClick,
  onFundingFeedInvestorsClick,
  onBackerProjectsClick,
  searchValue,
}) => {
  const { userData } = useContext(AuthContext);
  const ContentComponent = tableContentComponents[type];

  if (!ContentComponent) {
    return <></>;
  }

  return (
    <ContentComponent
      item={item}
      type={type}
      customColumns={customColumns}
      userData={userData}
      onFollowersClick={onFollowersClick}
      onFundingFeedInvestorsClick={onFundingFeedInvestorsClick}
      onBackerProjectsClick={onBackerProjectsClick}
      searchValue={searchValue}
    />
  );
};

export { formatPercent };

export default UniversalTableContent;
