import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { PageWrapper } from "../Tasks/styles";
import Tabs from "../../../global/Tabs";
import TasksTab from "./Tabs/Tasks";
import StagesTab from "./Tabs/Stages";
import OverviewTab from "./Tabs/Overview";
import FeedTab from "./Tabs/Feed";
// import {
//   PageDescription,
//   PageDescriptionWrapper,
// } from "../../nfts/News/Market/styles";

const tabs = ["My Boards", "Invited Boards", "Stages", "Overview", "Feed"];

const BoardLayout = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const router = useRouter();
  const { tab } = router.query;

  const updateActiveTab = (value: string) => {
    router.push("", { query: { tab: value.toLowerCase() } }, { shallow: true });
    setActiveTab(value);
  };

  useEffect(() => {
    tabs.forEach((item) => {
      if (tab) {
        if (item.toLowerCase() === tab) {
          router.push(
            "",
            { query: { tab: item.toLowerCase() } },
            { shallow: true }
          );
          setActiveTab(item);
        }
      }
    });
  }, [router, tab]);

  const renderContent = () => {
    switch (activeTab) {
      case "My Boards":
        return <TasksTab />;
      case "Invited Boards":
        return <TasksTab type="invited" />;
      case "Stages":
        return <StagesTab />;
      case "Overview":
        return <OverviewTab />;
      case "Feed":
        return <FeedTab />;
      default:
        return <TasksTab />;
    }
  };

  return (
    <PageWrapper>
      <div>
        <Tabs items={tabs} activeItem={activeTab} onClick={updateActiveTab} />
        {renderContent()}
      </div>
    </PageWrapper>
  );
};

export default BoardLayout;
