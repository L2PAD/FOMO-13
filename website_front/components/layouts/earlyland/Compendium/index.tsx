import React, { useContext, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useRouter } from "next/router";
import { EarlylandProjectsTabs } from "../../../../staticContent/tabs";
import FilterSortHeader from "../../../global/FilterSortHeader";
import Tabs from "../../../global/Tabs";
import ViewTable from "../../../global/Tables/ViewTable";
import { filtersInitital } from "../Projects";
import {
  PageDescription,
  PageDescriptionWrapper,
} from "../../projects/Parsing/styles";
import CommentBlock from "../../../global/CommentBlock";
import Pagination from "../../../global/Pagintaion";
import { LocationContext } from "../../../global/Layout";
import useComments from "../../../../hooks/useComments";
import fetchProjects from "../../../../http/projects/fetchProjects";
import getProjectType from "../../../../helpers/getProjectType";
import fetchFunds from "../../../../http/funds/fetchFunds";
import { Investor, IProject } from "../../../../types/global_types";
import {
  ProjectCardItem,
  ProjectsWrapper,
  PageWrapper,
  ProjectCardLink,
} from "./styles";

const CompendiumPage = () => {
  const [activeTab, setActiveTab] = useState(EarlylandProjectsTabs[0]);
  const [investorsFilter, setInvestorsFilter] = useState<Array<string>>([]);
  const [rangeFilterValues, setRangeFilterValues] = useState<Array<number>>([
    0, 10000000,
  ]);
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState<string>("Low");
  const [page, setPage] = useState(1);
  const [grid, setGrid] = useState(true);
  const router = useRouter();
  const { tab } = router.query;

  const { path } = useContext(LocationContext);
  const { comments, confirmAddComment } = useComments(
    `comments/${path}`,
    `comments/${path}`
  );
  const { data } = useQuery(["path", activeTab, sortValue], () =>
    fetchProjects(getProjectType("compendium"), "", "")
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
      <PageDescriptionWrapper>
        <h1>Compendium</h1>
        <br />
        <PageDescription variant="p">
          Explore comprehensive resources and information on various aspects of
          the crypto world, including tech, NFTs, drops, and promotions. This
          page offers valuable materials, analysis, and insights to keep you
          updated on the latest trends and broaden your knowledge. Engage with
          the community by leaving comments and discussing topics with other
          users.
        </PageDescription>
      </PageDescriptionWrapper>
      <Tabs
        items={EarlylandProjectsTabs}
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
              <ProjectCardLink
                href={`/earlyland/compendium/${item._id}`}
                key={item._id}
              >
                <ProjectCardItem
                  type="earlyLand"
                  //@ts-ignore
                  cardData={{ ...item, isCompendium: true }}
                />
              </ProjectCardLink>
            );
          })
        ) : (
          <ViewTable
            type="earlyLand"
            cardsData={{
              //@ts-ignore
              cards: filteredProjects?.map((item) => ({
                ...item,
                onClick: () => router.push(`/earlyland/compendium/${item._id}`),
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
      <CommentBlock items={comments} addComment={confirmAddComment} />
    </PageWrapper>
  );
};

export default CompendiumPage;
