import React, { createContext, useState } from "react";
import { useQuery } from "react-query";
import { useRouter } from "next/router";
import fetchDeals from "../../../../http/otc/fetchDeals";
import Typography from "../../../global/common/Typography";
import Tabs from "../../../global/Tabs";
import WLMarket from "./WLMarket";
import AllSwaps from "./AllSwaps";
import VerifiedCollection from "./VerifiedCollection";
import TopMembers from "./TopMembers";
import MyDeals from "./MyDeals";
import { PageContent, TabsContentWrapper } from "../OTC/styles";
import { Subtitle } from "../FomoChat/styles";
import { PageWrapper } from "../Onchain/styles";

export const P2PDealsContext = createContext<{ activeTab: string }>({
  activeTab: "all",
});

const tabs = [
  "All Swaps",
  "WL Market",
  "Fiat Market",
  "Top members",
  "My Deals",
];

const P2PExchange = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const router = useRouter();
  const updateActiveTab = (value: string) => {
    router.push("", { query: { tab: value.toLowerCase() } }, { shallow: true });
    setActiveTab(value);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "All Swaps":
        return <AllSwaps />;
      case "WL Market":
        return <WLMarket setTab={updateActiveTab} />;
      case "Top members":
        return <TopMembers />;
      case "Verified collection":
        return <VerifiedCollection />;
      case "My Deals":
        return <MyDeals />;
      default:
        return <AllSwaps />;
    }
  };

  return (
    <P2PDealsContext.Provider value={{ activeTab }}>
      <PageWrapper>
        <Typography variant="h1">P2P Exchange</Typography>
        <br />
        <Subtitle>
          Exchange (buy/sell) your assets with other verified participants.
        </Subtitle>
        <PageContent>
          <Tabs
            className="secondary p2p-tabs"
            items={tabs}
            activeItem={activeTab}
            onClick={updateActiveTab}
          />
          <TabsContentWrapper>{renderContent()}</TabsContentWrapper>
        </PageContent>
      </PageWrapper>
    </P2PDealsContext.Provider>
  );
};

export default P2PExchange;
