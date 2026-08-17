import React, { useState } from "react";
import Link from "next/link";
import { PersonsData } from "../../../../../../staticContent/projects/persons";
import Tabs from "../../../../../global/Tabs";
import {
  PersonCardWrapper,
  PersonsWrapper,
  ShowAllButton,
  ShowAllWrapper,
  Wrapper,
} from "./styles";

const items = ["Team", "Advisors", "Partners"];

const PersonsTabs = () => {
  const [activeTab, setActiveTab] = useState(items[0]);
  const [showAll, setShowAll] = useState(false);

  const renderTable = (Data: any) => {
    return Data.map((item: any, i: number) => {
      if (!showAll) {
        if (i < 5) {
          return (
            <Link href="/crypto/persons/123" key={i}>
              {/*//@ts-ignore*/}
              <PersonCardWrapper {...item} />
            </Link>
          );
        }
        return null;
      }
      return (
        <Link href="/crypto/persons/123" key={i}>
          {/*//@ts-ignore*/}
          <PersonCardWrapper {...item} />
        </Link>
      );
    });
  };

  const personsRender = (value: string) => {
    switch (value) {
      case "Team":
        return renderTable(PersonsData);
      case "Advisors":
        return renderTable(PersonsData);
      case "Partners":
        return renderTable(PersonsData);
      default:
        return null;
    }
  };

  return (
    <Wrapper>
      <Tabs
        items={items}
        activeItem={activeTab}
        onClick={(value) => {
          setActiveTab(value);
          setShowAll(false);
        }}
      />
      <PersonsWrapper>{personsRender(activeTab)}</PersonsWrapper>
      <ShowAllWrapper>
        <ShowAllButton onClick={() => setShowAll((state) => !state)}>
          {showAll ? "Hide" : "Show"} all
        </ShowAllButton>
      </ShowAllWrapper>
    </Wrapper>
  );
};

export default PersonsTabs;
