import React, { useState } from "react";
import { SearchIconStyle } from "../../../../global/Navigation/styles";
import Filter from "../../../../global/Filter";
import { OptionsForSortProjectsPage } from "../../../../../staticContent/global";
import ActionTwitterItem from "../../../../global/ActionTwitterItem";
import { TwitterActionsWrapper } from "../../../../global/ActionTwitterItem/styles";
import Pagination from "../../../../global/Pagintaion";
import {
  ActionsWrapper,
  AddFavAction,
  DropdownWrapper,
  PageDescription,
  PageDescriptionWrapper,
  SearchInput,
  SubTabsAction,
  SubTabsFavWrapper,
  SubTabsWrapper,
} from "./styles";

const Smart = () => {
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [sortValue, setSortValue] = useState(OptionsForSortProjectsPage[0]);
  const [activeSubTab, setActiveSubTab] = useState(false);

  return (
    <div>
      <SubTabsWrapper>
        <SubTabsAction
          onClick={() => setActiveSubTab(false)}
          active={!activeSubTab}
        >
          Main
        </SubTabsAction>
        <SubTabsFavWrapper>
          <SubTabsAction
            onClick={() => setActiveSubTab(true)}
            active={activeSubTab}
          >
            Favourites
          </SubTabsAction>
          {activeSubTab && <AddFavAction>+ Add to favourites</AddFavAction>}
        </SubTabsFavWrapper>
      </SubTabsWrapper>
      <PageDescriptionWrapper>
        <PageDescription variant="p">
          Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
          sint. Velit officia consequat duis enim velit mollit. Exercitation
          veniam consequat sunt nostrud amet. Amet minim mollit non deserunt
          ullamco est sit aliqua dolor do amet sint. Velit officia consequat
          duis enim velit mollit.
        </PageDescription>
      </PageDescriptionWrapper>
      <div>
        <SearchInput
          type="text"
          placeholder="Search"
          onChange={(value: string) => setSearchValue(value)}
          leftIcon={<SearchIconStyle />}
          value={searchValue}
        />
      </div>
      <ActionsWrapper>
        <Filter />
        <DropdownWrapper
          label="Sort by"
          onChange={setSortValue}
          value={sortValue}
          options={OptionsForSortProjectsPage}
        />
      </ActionsWrapper>
      <TwitterActionsWrapper>
        {/* {Array(8)
          .fill("")
          .map((item, i) => {
            return <ActionTwitterItem key={i} />;
          })} */}
        <Pagination
          page={page}
          total={20}
          limit={10}
          totalPage={20}
          onChange={(value) => setPage(value)}
        />
      </TwitterActionsWrapper>
    </div>
  );
};

export default Smart;
