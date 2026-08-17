import React, { useState } from "react";
import { SearchIconStyle } from "../../../../global/Navigation/styles";
import Filter from "../../../../global/Filter";
import { OptionsForSortProjectsPage } from "../../../../../staticContent/global";
import CommentBlock from "../../../../global/CommentBlock";
import {
  ActionsWrapper,
  DropdownWrapper,
  PageDescription,
  PageDescriptionWrapper,
  SearchInput,
} from "./styles";

const Smart = () => {
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState(OptionsForSortProjectsPage[0]);

  return (
    <div>
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
      <CommentBlock />
    </div>
  );
};

export default Smart;
