import React, { useState } from "react";
import { PersonsData } from "../../../../../../staticContent/projects/persons";
import Tabs from "../../../../../global/Tabs";
import {
  PersonCardWrapper,
  PersonsWrapper,
  ShowAllButton,
  ShowAllWrapper,
  Wrapper,
} from "./styles";
import { InvestorsContainer } from "../../../../projects/Crypto/Project/Investors/styles";

const items = ["Team", "Advisors", "Partners"];

const PersonsTabs = () => {
  const [activeTab, setActiveTab] = useState(items[0]);
  const [showAll, setShowAll] = useState(false);

  const renderTable = (Data: any) => {
    return Data.map((item: any, i: number) => {
      if (!showAll) {
        if (i < 5) {
          //@ts-ignore
          return <PersonCardWrapper key={i} {...item} />;
        }
        return null;
      }
      //@ts-ignore
      return <PersonCardWrapper key={i} {...item} />;
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
      <InvestorsContainer>
        <PersonsWrapper>{personsRender(activeTab)}</PersonsWrapper>
      </InvestorsContainer>
      <ShowAllWrapper>
        <ShowAllButton onClick={() => setShowAll((state) => !state)}>
          {showAll ? "Hide" : "Show"} all
        </ShowAllButton>
      </ShowAllWrapper>
    </Wrapper>
  );
};

export default PersonsTabs;
