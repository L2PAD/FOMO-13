import React, { useMemo, useState } from "react";
import { useRouter } from "next/router";
import FilterSortHeader from "../../../global/FilterSortHeader";
import { PersonsData } from "../../../../staticContent/projects/persons";
import ViewTable from "../../../global/Tables/ViewTable";
import {
  CardLinkWrapper,
  CardsWrapper,
  CardWrapper,
  PageWrapper,
} from "./styles";
import Typography from "../../../global/common/Typography";
import {
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
} from "../../projects/Networks/styles";
import CommentBlock from "../../../global/CommentBlock";
import { Subtitle } from "../../projects/FomoChat/styles";
import useComments from "../../../../hooks/useComments";
import fetchPersons from "../../../../http/persons/fetchPersons";
import { useQuery } from "react-query";
import useSort from "../../../../hooks/useSort";
import { IPerson, IProject } from "../../../../types/global_types";

const Persons = () => {
  const { comments, confirmAddComment } = useComments(
    "comments/nfts",
    "comments/nfts"
  );
  const { data } = useQuery("persons", fetchPersons);
  const [grid, setGrid] = useState(true);
  const [page, setPage] = useState(1);
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState("");
  const sortProjects = useSort("name", sortValue === "A-Z" ? "asc" : "desc");

  const sortedPersons: Array<IPerson> = useMemo(() => {
    if (!data?.persons?.length) return [];

    if (!searchValue && !sortValue) return data.persons;

    if (!searchValue && sortValue) return data.persons.sort(sortProjects);

    return data.persons.filter((item: IPerson) => {
      return item.name.toLowerCase().includes(searchValue.toLowerCase());
    });
  }, [data, searchValue, sortValue]);

  return (
    <PageWrapper>
      <Typography variant="h1">Persons</Typography>
      <br />
      <Subtitle>
        Explore key individuals in the crypto space, their projects,
        partnerships, and influence on the market. Be aware of who you are
        dealing with.
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
      <FilterSortHeader
        grid={grid}
        setGrid={setGrid}
        sort={{
          label: "Sort by",
          type: "name",
          options: [
            {
              label: "Name",
              items: ["A-Z", "Z-A"],
              value: sortValue,
              setValue: setSortValue,
            },
          ],
        }}
      />
      {grid ? (
        <CardsWrapper>
          {sortedPersons?.length ? (
            sortedPersons.map((item: any) => {
              return (
                <CardLinkWrapper href={`persons/${item._id}`} key={item._id}>
                  {/*//@ts-ignore*/}
                  <CardWrapper
                    logo={String(item.logo)}
                    name={item.name}
                    rating={item.rating}
                  />
                </CardLinkWrapper>
              );
            })
          ) : (
            <></>
          )}
        </CardsWrapper>
      ) : (
        <ViewTable
          type="fund"
          cardsData={{
            //@ts-ignore
            cards: sortedPersons.map((item: any) => ({
              logo: String(item.logo),
              name: item.name,
              rating: item.rating,
              redFlags: item.redFlagsList?.length,
              banner: item.banner,
              onClick: () => router.push(`persons/${item._id}`),
            })),
          }}
        />
      )}
      <CommentBlock items={comments} addComment={confirmAddComment} />
    </PageWrapper>
  );
};

export default Persons;
