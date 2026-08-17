import React, { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import { ProjectsProjectsTabs } from "../../../../staticContent/tabs";
import FilterSortHeader from "../../../global/FilterSortHeader";
import Tabs from "../../../global/Tabs";
import ViewTable from "../../../global/Tables/ViewTable";
import Pagination from "../../../global/Pagintaion";
import {
  ProjectCardItem,
  ProjectsWrapper,
  PageWrapper,
  ProjectCardLink,
  DescriptionTitle,
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
import UserAvatar from "../../../global/common/UserAvatar";
import { LocationContext } from "../../../global/Layout";
import useComments from "../../../../hooks/useComments";
import { Investor, IProject } from "../../../../types/global_types";
import fetchProjects from "../../../../http/projects/fetchProjects";
import getProjectType from "../../../../helpers/getProjectType";
import fetchFunds from "../../../../http/funds/fetchFunds";
import imageLoader from "../../../../helpers/imageLoader";
import changeDateType from "../../../../helpers/changeDateType";

export const filtersInitital = [
  {
    type: "range",
    title: "Total raised",
    range: [0, 10000000],
    step: 1000,
  },
  {
    type: "select",
    title: "Investors",
    placeholder: "Choose investor",
    items: [
      {
        name: "Fund name1",
        value: "fund_name1",
      },
      {
        name: "Fund name2",
        value: "fund_name2",
      },
      {
        name: "Fund name3",
        value: "fund_name3",
      },
      {
        name: "Fund name4",
        value: "fund_name4",
      },
    ],
  },
];

const Projects = () => {
  const [activeTab, setActiveTab] = useState(ProjectsProjectsTabs[0]);
  const [investorsFilter, setInvestorsFilter] = useState<Array<string>>([]);
  const [rangeFilterValues, setRangeFilterValues] = useState<Array<number>>([
    0, 10000000,
  ]);
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState<string>("Low");

  const [grid, setGrid] = useState(true);
  const [page, setPage] = useState(1);
  const router = useRouter();
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
      <Typography variant="h1">Projects</Typography>
      <br />
      <Subtitle>
        Explore early access to innovative crypto projects on the zkSync
        platform. Invest in new opportunities during their developmental stages
        and benefit from participating in high-potential projects. Track active,
        upcoming, and completed projects to seize the most promising
        opportunities before they become widely available.{" "}
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
              <ProjectCardLink href={`/earlyland/project/${item._id}`} key={i}>
                <ProjectCardItem
                  type="earlyLand"
                  //@ts-ignore
                  cardData={item}
                />
              </ProjectCardLink>
            );
          })
        ) : (
          <ViewTable
            type="earlyLand"
            //@ts-ignore
            cardsData={{
              //@ts-ignore
              cards: filteredProjects.map((item: IProject) => ({
                ...item,
                onClick: () => router.push(`/earlyland/project/${item._id}`),
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
        <DescriptionTitle variant="p">
          Stars rewards
          <span>
            Upcoming and active top tier IDOs & crypto launchpad offerings.
          </span>
          <br />
        </DescriptionTitle>
        <Table variant="default">
          <div className="header">
            <p>Projects</p>
            <p>Type</p>
            <p>Rewards</p>
            <p>Max Participants</p>
            <p>Requirements</p>
            <p>Date rewards</p>
          </div>
          {filteredProjects?.map((item: IProject, index) => (
            <div className="row" key={index}>
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
              <div className="stats">{item.type ? <p>{item.type}</p> : ""}</div>
              <div>
                <p>{item.rewards}</p>
              </div>
              <div>
                <p>{item.maxParticipants}</p>
              </div>
              <div>
                <p>{item.requirements}</p>
              </div>
              <div>
                <p>{changeDateType(item.dateRewards || new Date())}</p>
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
      </ProjectsWrapper>
      <CommentBlock items={comments} addComment={confirmAddComment} />
    </PageWrapper>
  );
};

export default Projects;
