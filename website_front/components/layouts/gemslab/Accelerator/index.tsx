import React, { useContext, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import { ProjectsProjectsTabs } from "../../../../staticContent/tabs";
import FilterSortHeader from "../../../global/FilterSortHeader";
import projectDescriptionImageTimer from "../../../../public/static/main/baner.png";
import { GemsLabProjects } from "../../../../staticContent/gemslab";
import Tabs from "../../../global/Tabs";
import { useTimer } from "../../../../hooks/useTimer";
import Pagination from "../../../global/Pagintaion";
import {
  ProjectCardItem,
  ProjectsWrapper,
  PageWrapper,
  ProjectCardLink,
  TimerBlockWrapper,
  TimerWrapper,
  TimerTitle,
  TimerSecondTitle,
  TimerValue,
  TimerButton,
  DescriptionTitle,
  Table,
} from "./styles";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../../projects/FomoChat/styles";
import {
  PageDescription,
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
} from "../../projects/Networks/styles";
import CommentBlock from "../../../global/CommentBlock";
import { LocationContext } from "../../../global/Layout";
import useComments from "../../../../hooks/useComments";
import fetchProjects from "../../../../http/projects/fetchProjects";
import getProjectType from "../../../../helpers/getProjectType";
import fetchFunds from "../../../../http/funds/fetchFunds";
import { Investor, IProject } from "../../../../types/global_types";
import ViewTable from "../../../global/Tables/ViewTable";
import BannerList from "../../../global/BannerList";
import * as path from "path";
import imageLoader from "../../../../helpers/imageLoader";
import UserAvatar from "../../../global/common/UserAvatar";

interface Props {
  name: string;
  title: string;
  subtitle: string;
}

const filtersInitital = [
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

const Accelerator = ({ name, title, subtitle }: Props) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(ProjectsProjectsTabs[0]);
  const [investorsFilter, setInvestorsFilter] = useState<Array<string>>([]);
  const [rangeFilterValues, setRangeFilterValues] = useState<Array<number>>([
    0, 10000000,
  ]);
  const [sortValue, setSortValue] = useState<string>("Low");
  const [searchValue, setSearchValue] = useState("");

  const [grid, setGrid] = useState(true);
  const [page, setPage] = useState(1);

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
      return data?.projects?.filter((project: IProject) => {
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
      <Typography variant="h1">{name}</Typography>
      <br />
      <Subtitle>{title}</Subtitle>
      <br />
      <PageDescription variant="p">{subtitle}</PageDescription>
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
          filteredProjects?.map((item: IProject) => {
            return (
              <ProjectCardLink
                href={`/gemslab/launch/${item._id}`}
                key={item._id}
              >
                <ProjectCardItem
                  type="default"
                  //@ts-ignore
                  cardData={item}
                />
              </ProjectCardLink>
            );
          })
        ) : (
          <ViewTable
            type="project"
            cardsData={{
              //@ts-ignore
              cards: filteredProjects?.map((item: IProject) => ({
                ...item,
                onClick: () => router.push(`/gemslab/launch/${item._id}`),
              })),
            }}
          />
        )}
        {Number(data?.projects?.length) > 20 ? (
          <Pagination
            page={page}
            total={0}
            limit={data?.projects?.length}
            totalPage={Number(data?.projects?.length) / 20}
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
      </DescriptionTitle>
      <ProjectsWrapper>
        <Table variant="default">
          <div className="header">
            <p>Projects</p>
            <p>Status</p>
            <p>SHO Total Raise</p>
            <p>All Time High</p>
            <p>Type</p>
          </div>
          {data?.projects?.map((item: IProject) => (
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
                {item.status ? <p>{item.status}</p> : ""}
              </div>
              <div>
                <p>{item.totalRaised}</p>
              </div>
              <div>
                <p>{item.highPrice || 0}</p>
              </div>
              <div>
                <p>{item.niche || "-"}</p>
              </div>
            </div>
          ))}
        </Table>
        <br />
        {/* <Pagination
          page={page}
          total={20}
          limit={50}
          totalPage={20}
          onChange={(value) => setPage(value)}
        /> */}
      </ProjectsWrapper>
      <DescriptionTitle variant="p">
        Featured token sales
        <span>
          Upcoming and active top tier IDOs & crypto launchpad offerings.
        </span>
      </DescriptionTitle>
      <BannerList path="gemslab" />
      <CommentBlock items={comments} addComment={confirmAddComment} />
    </PageWrapper>
  );
};

export default Accelerator;
