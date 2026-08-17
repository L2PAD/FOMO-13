import React, { useState } from "react";
import dynamic from "next/dynamic";
import Tabs from "../../../../global/Tabs";
import Info from "./Info";
import { ContentWrapper, Wrapper } from "./styles";
import Activity from "./Activity";
import Bids from "./Bids";

const Price = dynamic(() => import("./Price"), { ssr: false });

const items = ["Info", "Price", "Bids", "Activity"];

const TabsInfo3 = () => {
  const [activeTab, setActiveTab] = useState(items[0]);

  const getRenderContent = () => {
    switch (activeTab) {
      case "Info":
        return <Info />;
      case "Activity":
        return <Activity />;
      case "Price":
        return <Price />;
      case "Bids":
        return <Bids />;
      default:
        return null;
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

export default TabsInfo3;
