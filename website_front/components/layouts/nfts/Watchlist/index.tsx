import React, { useState } from "react";
import { useRouter } from "next/router";
import { NFTsProjectsProjects } from "../../../../staticContent/nfts/projects";
import FilterSortHeader from "../../../global/FilterSortHeader";
import ViewTable from "../../../global/Tables/ViewTable";
import {
  PageWrapper,
  ProjectCardItem,
  ProjectCardLink,
  ProjectsWrapper,
} from "./styles";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../../projects/FomoChat/styles";
import {
  SearchInput,
  SearchWrapper,
  SearchIconStyle,
} from "../../projects/Networks/styles";

const Watchlist = () => {
  const [grid, setGrid] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const router = useRouter();

  return (
    <PageWrapper>
      <Typography variant="h1">Watchlist</Typography>
      <br />
      <Subtitle>
        Add here most interesting projects for you and watch their journey.
      </Subtitle>
      <SearchWrapper>
        <SearchInput
          type="text"
          placeholder="Search the project/fund/person"
          onChange={(value: string) => setSearchValue(value)}
          leftIcon={<SearchIconStyle />}
          value={searchValue}
        />
      </SearchWrapper>
      <br />
      <FilterSortHeader
        grid={grid}
        setGrid={setGrid}
        sort={{
          label: "Sort by",
          type: "name / date",
          options: [
            {
              label: "Name",
              items: ["A-Z", "Z-A"],
              value: name,
              setValue: setName,
            },
            {
              label: "Date",
              items: ["New", "Old"],
              value: date,
              setValue: setDate,
            },
          ],
        }}
      />
      <ProjectsWrapper>
        {grid ? (
          NFTsProjectsProjects.map((item, i) => {
            return (
              <ProjectCardLink href="project/234" key={i}>
                {/*// @ts-ignore*/}
                <ProjectCardItem {...item} />
              </ProjectCardLink>
            );
          })
        ) : (
          <ViewTable
            type="watchlist"
            cardsData={{
              //@ts-ignore
              cards: NFTsProjectsProjects.map((item) => ({
                ...item.cardData,
                floorPrice: item.cardData.price,
                //@ts-ignore
                onClick: () => router.push("project/123"),
              })),
            }}
          />
        )}
      </ProjectsWrapper>
    </PageWrapper>
  );
};

export default Watchlist;
