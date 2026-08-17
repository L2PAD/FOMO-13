/* eslint-disable */
import React, { useState, FC, useContext } from "react";
import Link from "next/link";
import { AuthContext } from "../../../../../global/Layout";
import EditItemsButton from "../../../../../global/common/EditItemsButton";
import Tabs from "../../../../../global/Tabs";
import { getBackerHref } from "../../../../../../helpers/backerRoute";
import {
  PersonCardWrapper,
  PersonCardsContainer,
  PersonsWrapper,
  ShowAllButton,
  ShowAllWrapper,
  Wrapper,
} from "./styles";

const items = ["Team", "Advisors", "Partners"];

interface IProps {
  team?: Array<any>;
  advisors?: Array<any>;
  partners?: Array<any>;
  toggleUpdateModal: () => void;
  activeTab: any;
  setActiveTab: any;
  isEdit?: boolean;
}

const PersonsTabs: FC<IProps> = ({
  team,
  advisors,
  partners,
  toggleUpdateModal,
  activeTab,
  setActiveTab,
  isEdit,
}) => {
  const { userData } = useContext(AuthContext);
  const [showAll, setShowAll] = useState(false);

  const renderTable = (Data: any) => {
    return Data?.map((item: any, i: number) => {
      if (!showAll) {
        if (i < 5) {
          return (
            <Link href={getBackerHref(item, "person")} key={i}>
              {/*//@ts-ignore*/}
              <PersonCardWrapper {...item} />
            </Link>
          );
        }
        return null;
      }
      return (
        <Link href={getBackerHref(item, "person")} key={i}>
          {/*//@ts-ignore*/}
          <PersonCardWrapper {...item} />
        </Link>
      );
    });
  };

  const personsRender = (value: string) => {
    switch (value) {
      case "Team":
        return renderTable(team);
      case "Advisors":
        return renderTable(advisors);
      case "Partners":
        return renderTable(partners);
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
      {isEdit ? (
        <EditItemsButton
          type={activeTab.toLowerCase()}
          onClick={() => toggleUpdateModal && toggleUpdateModal()}
        />
      ) : (
        <></>
      )}
      <PersonCardsContainer>
        <PersonsWrapper>{personsRender(activeTab)}</PersonsWrapper>
      </PersonCardsContainer>
      <ShowAllWrapper>
        <ShowAllButton onClick={() => setShowAll((state) => !state)}>
          {showAll ? "Hide" : "Show"} all
        </ShowAllButton>
      </ShowAllWrapper>
    </Wrapper>
  );
};

export default PersonsTabs;
