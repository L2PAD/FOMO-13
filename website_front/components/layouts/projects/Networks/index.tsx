import React, { useState } from "react";
import { SearchIconStyle, SearchInput, SearchWrapper } from "./styles";
import { PageWrapper } from "../Onchain/styles";
import CommentBlock from "../../../global/CommentBlock";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../FomoChat/styles";

const Networks = () => {
  const [searchValue, setSearchValue] = useState("");

  return (
    <PageWrapper>
      <Typography variant="h1">L1 Public network</Typography>
      <br />
      <Subtitle>
        This section shows where or with who a person (or fund etc) has
        interacted or is interacting now. For example, seeing that a person
        participated in a failed project might give a clue that a new project
        he/she is participating in may fail as well.
      </Subtitle>
      <SearchWrapper>
        <SearchInput
          value={searchValue}
          onChange={(value) => setSearchValue(value)}
          placeholder="Search the project/fund/person"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
      </SearchWrapper>
      <CommentBlock />
    </PageWrapper>
  );
};

export default Networks;
