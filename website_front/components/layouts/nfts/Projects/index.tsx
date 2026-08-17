import React, { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { NFTsProjectsProjects } from "../../../../staticContent/nfts/projects";
import FilterSortHeader from "../../../global/FilterSortHeader";
import Tabs from "../../../global/Tabs";
import ViewTable from "../../../global/Tables/ViewTable";
import {
  DescriptionTitle,
  PageWrapper,
  ProjectCardItem,
  ProjectCardLink,
  ProjectsWrapper,
  Table,
} from "./styles";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../../projects/FomoChat/styles";
import {
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
} from "../../projects/Networks/styles";
import CommentBlock from "../../../global/CommentBlock";
import Pagination from "../../../global/Pagintaion";
import UserAvatar from "../../../global/common/UserAvatar";
import { ProjectsProjectsTabs } from "../../../../staticContent/tabs";
import { LocationContext } from "../../../global/Layout";
import useComments from "../../../../hooks/useComments";
import { useQuery } from "react-query";
import fetchProjects from "../../../../http/projects/fetchProjects";
import getProjectType from "../../../../helpers/getProjectType";
import fetchFunds from "../../../../http/funds/fetchFunds";
import { Investor, IProject } from "../../../../types/global_types";
import imageLoader from "../../../../helpers/imageLoader";
import { filtersInitital } from "../../earlyland/Projects";

const Projects = () => {
  const [investorsFilter, setInvestorsFilter] = useState<Array<string>>([]);
  const [rangeFilterValues, setRangeFilterValues] = useState<Array<number>>([
    0, 10000000,
  ]);
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState<string>("Low");
  const [activeTab, setActiveTab] = useState(ProjectsProjectsTabs[0]);
  const [page, setPage] = useState(1);
  const [grid, setGrid] = useState(true);
  const router = useRouter();
  const { tab } = router.query;
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");

  const { path } = useContext(LocationContext);
  const { comments, confirmAddComment } = useComments(
    `comments/${path}`,
    `comments/${path}`
  );
  const { data } = useQuery(["path", activeTab, sortValue], () =>
    fetchProjects(getProjectType(path), activeTab, sortValue)
  );
  const investors = useQuery("investors", fetchFunds);

  const updateActiveTab = (value: string) => {
    setActiveTab(value);
  };

  const rangeValidation = (
    project: IProject,
    minValue: number,
    maxValue: number
  ): boolean => {
    return (
      Number(project.totalRaised) <= maxValue &&
      Number(project.totalRaised) >= minValue
    );
  };

  const filteredProjects: Array<IProject> | undefined = useMemo(() => {
    if (!searchValue && !investorsFilter.length) {
      return data?.projects.filter((project: IProject) => {
        return rangeValidation(
          project,
          rangeFilterValues[0],
          rangeFilterValues[1]
        );
      });
    }

    if (!searchValue && investorsFilter.length) {
      return data?.projects.filter((project: IProject) => {
        const isInvestorsValid: boolean =
          !investorsFilter.length ||
          project.investors.find((investor: Investor) => {
            return investorsFilter.includes(investor._id);
          });
        const isRangeValid: boolean = rangeValidation(
          project,
          rangeFilterValues[0],
          rangeFilterValues[1]
        );

        return isInvestorsValid && isRangeValid;
      });
    }

    const searchProjects: Array<IProject> | undefined = data?.projects.filter(
      (project: IProject) => {
        const isRangeValid: boolean = rangeValidation(
          project,
          rangeFilterValues[0],
          rangeFilterValues[1]
        );
        const isSearchValid: boolean = project.name
          .toLowerCase()
          .includes(searchValue.toLowerCase());
        const isInvestorsValid: boolean =
          !investorsFilter.length ||
          project.investors.find((investor: Investor) => {
            return investorsFilter.includes(investor._id);
          });
        return isSearchValid && isInvestorsValid && isRangeValid;
      }
    );

    return searchProjects;
  }, [searchValue, data, investorsFilter, rangeFilterValues]);

  return (
    <PageWrapper>
      <Typography variant="h1">Minting NFT</Typography>
      <br />
      <Subtitle>
        Discover and mint your NFTs in the zkSync marketplace. Buy, sell, and
        track active, upcoming, and ended NFT projects with real-time
        insights.{" "}
      </Subtitle>
      <br />
      <SearchWrapper>
        <SearchInput
          value={searchValue}
          onChange={(value) => setSearchValue(value)}
          placeholder="Search the project/fund/person"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
      </SearchWrapper>
      <br />
      <Tabs
        items={ProjectsProjectsTabs}
        activeItem={activeTab}
        onClick={updateActiveTab}
      />
      <FilterSortHeader
        onSelectedChange={(selectedInvestors: any) =>
          setInvestorsFilter(
            selectedInvestors.map(
              (invItem: { name: string; value: string }) => invItem.value
            )
          )
        }
        onRangeChange={(values: any) => setRangeFilterValues(values)}
        grid={grid}
        setGrid={setGrid}
        filters={filtersInitital.map((item: any, index) => {
          if (index === 1) {
            return {
              ...item,
              items:
                investors.data?.funds.map((item) => {
                  return { name: item.name, value: item._id };
                }) || [],
            };
          }
          return item;
        })}
        sort={{
          label: "Sort by",
          type: "total raised",
          options: [
            {
              label: "Total raised",
              items: ["Low", "High"],
              value: sortValue,
              setValue: setSortValue,
            },
          ],
        }}
      />
      <ProjectsWrapper>
        {grid ? (
          filteredProjects?.map((item: IProject, i) => {
            return (
              <ProjectCardLink href={`minting/${item._id}`} key={item._id}>
                {/*// @ts-ignore*/}
                <ProjectCardItem cardData={item} type="nft" />
              </ProjectCardLink>
            );
          })
        ) : (
          <ViewTable
            type="watchlist"
            cardsData={{
              //@ts-ignore
              cards: filteredProjects?.map((item: IProject) => ({
                ...item,
                onClick: () => router.push(`minting/${item._id}`),
              })),
            }}
          />
        )}
        {Number(data?.projects?.length) > 16 ? (
          <Pagination
            page={page}
            total={20}
            limit={50}
            totalPage={20}
            onChange={(value) => setPage(value)}
          />
        ) : (
          <></>
        )}
      </ProjectsWrapper>
      <DescriptionTitle variant="p">
        Project stats
        <span>
          Upcoming and active top tier IDOs & crypto launchpad offerings.
        </span>
        <br />
      </DescriptionTitle>
      <Table variant="default">
        <div className="header">
          <p>Projects</p>
          <p>Status</p>
          <p>SHO Total Raise</p>
          <p>All Time High</p>
          <p>Type</p>
        </div>
        {filteredProjects?.map((item: IProject) => (
          <div className="row" key={item._id}>
            <div className="project">
              <UserAvatar
                size="small"
                variant="default"
                avatar={imageLoader(String(item.logo))}
                name={item.name}
              />
              <div>
                <p>{item.name}</p>
                <span>{item.banner}</span>
              </div>
            </div>
            <div className="stats">
              <p>{item.status}</p>
            </div>
            <div>
              <p>{item.totalRaised}$</p>
            </div>
            <div>
              {/* all time hight */}
              <p>-</p>
            </div>
            <div>
              <p>{item.type || "-"}</p>
            </div>
          </div>
        ))}
      </Table>
      <br />
      {Number(data?.projects?.length) > 16 ? (
        <Pagination
          page={page}
          total={20}
          limit={50}
          totalPage={20}
          onChange={(value) => setPage(value)}
        />
      ) : (
        <></>
      )}
      <CommentBlock items={comments} addComment={confirmAddComment} />
    </PageWrapper>
  );
};

export default Projects;
