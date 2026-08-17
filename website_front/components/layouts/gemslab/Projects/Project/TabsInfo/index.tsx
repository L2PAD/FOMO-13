import React, { useState } from "react";
import Tabs from "../../../../../global/Tabs";
import { ContentWrapper, Wrapper } from "./styles";
import Activity from "./Activity";
import Bids from "./Bids";

const items = ["Bids", "Activity"];

const TabsInfo = () => {
  const [activeTab, setActiveTab] = useState(items[0]);

  const getRenderContent = () => {
    switch (activeTab) {
      case "Activity":
        return <Activity />;
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

export default TabsInfo;
