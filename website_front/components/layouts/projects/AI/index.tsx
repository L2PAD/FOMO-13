import React, { useState } from "react";
import Tabs from "../../../global/Tabs";
import { PageWrapper, PageDescriptionWrapper } from "./styles";
import PriceChange from "./PriceChange";
import { Subtitle } from "../FomoChat/styles";
import SmartContract from "./SmartContract";

const tabs = ["Price change", "Smart contract"];

const AIPage = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const renderPage = () => {
    switch (activeTab) {
      case "Price change":
        return <PriceChange />;
      case "Smart contract":
        return <SmartContract />;
      default:
        return <PriceChange />;
    }
  };

  return (
    <PageWrapper>
      <PageDescriptionWrapper>
        <h1>L3 AI Artificial intelligence</h1>
        <br />
        <Subtitle>
          AI- powered engine which simplifies the process of gathering, sorting
          and analyzing information about the market, its participants and
          affiliated persons.
        </Subtitle>
      </PageDescriptionWrapper>
      <div>
        <Tabs
          items={tabs}
          activeItem={activeTab}
          onClick={(value) => setActiveTab(value)}
        />
        {renderPage()}
      </div>
    </PageWrapper>
  );
};

export default AIPage;
