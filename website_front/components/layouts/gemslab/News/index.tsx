import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Tabs from "../../../global/Tabs";
import {
  ContentWrapper,
  PageDescription,
  PageDescriptionWrapper,
  PageWrapper,
} from "./styles";
import Smart from "./Smart";
import Parsing from "./Parsing";
import Market from "./Market";

const tabs = ["Smart", "Parsing", "Market"];

const News = () => {
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

  const activeTabHandler = () => {
    switch (activeTab) {
      case "Smart":
        return <Smart />;
      case "Parsing":
        return <Parsing />;
      case "Market":
        return <Market />;
      default:
        return null;
    }
  };

  return (
    <PageWrapper>
      <PageDescriptionWrapper>
        <PageDescription variant="p">
          Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
          sint. Velit officia consequat duis enim velit mollit. Exercitation
          veniam consequat sunt nostrud amet. Amet minim mollit non deserunt
          ullamco est sit aliqua dolor do amet sint. Velit officia consequat
          duis enim velit mollit.
        </PageDescription>
      </PageDescriptionWrapper>
      <Tabs items={tabs} activeItem={activeTab} onClick={updateActiveTab} />
      <ContentWrapper>{activeTabHandler()}</ContentWrapper>
    </PageWrapper>
  );
};

export default News;
