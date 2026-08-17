import React, { FC, useContext, useState } from "react";
import Tabs from "../../../../../global/Tabs";
import { ContentWrapper, Wrapper } from "./styles";
import Activity from "./Activity";
import Bids from "./Bids";
import Info from "./Info";
import Price from "./Price";
import { NftContext } from "..";
import { ICollectionNft, IOrder } from "../../../../../../types/global_types";

const items = ["Info", "Price", "Bids", "Activity"];

const TabsInfo = () => {
  const { nftData, orders, isOwner, confirmOrderByOwner } =
    useContext(NftContext);
  const [activeTab, setActiveTab] = useState(items[0]);

  const getRenderContent = () => {
    switch (activeTab) {
      case "Info":
        return <Info nftData={nftData} />;
      case "Price":
        return <Price />;
      case "Activity":
        return <Activity />;
      case "Bids":
        return (
          <Bids
            confirmOrder={confirmOrderByOwner}
            isOwner={isOwner}
            orders={orders}
          />
        );
      default:
        return <Info nftData={nftData} />;
    }
  };

  return (
    <Wrapper>
      <Tabs
        items={items}
        activeItem={activeTab}
        onClick={(value) => setActiveTab(value)}
      />
      <ContentWrapper>{getRenderContent()}</ContentWrapper>
    </Wrapper>
  );
};

export default TabsInfo;
