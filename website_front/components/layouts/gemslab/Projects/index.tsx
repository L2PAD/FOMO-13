import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ProjectsProjectsTabs } from "../../../../staticContent/tabs";
import FilterSortHeader from "../../../global/FilterSortHeader";
import { GemsLabProjects } from "../../../../staticContent/gemslab";
import Tabs from "../../../global/Tabs";
import ViewTable from "../../../global/Tables/ViewTable";
import Pagination from "../../../global/Pagintaion";
import {
  ProjectCardItem,
  ProjectsWrapper,
  PageWrapper,
  ProjectCardLink,
} from "./styles";

const Projects = () => {
  const [activeTab, setActiveTab] = useState(ProjectsProjectsTabs[0]);
  const [sortValue, setSorthValue] = useState("");
  const [page, setPage] = useState(1);
  const [grid, setGrid] = useState(true);
  const router = useRouter();
  const { tab } = router.query;

  const updateActiveTab = (value: string) => {
    router.push("", { query: { tab: value.toLowerCase() } }, { shallow: true });
    setActiveTab(value);
  };

  useEffect(() => {
    ProjectsProjectsTabs.forEach((item) => {
      if (tab) {
        if (item.toLowerCase() === tab) {
          router.push(
            "",
            { query: { tab: item.toLowerCase() } },
            { shallow: true }
          );
          setActiveTab(item);
        }
      }
    });
  }, [router, tab]);

  return (
    <PageWrapper>
      <Tabs
        items={ProjectsProjectsTabs}
        activeItem={activeTab}
        onClick={updateActiveTab}
      />
      <FilterSortHeader
        grid={grid}
        setGrid={setGrid}
        sort={{
          label: "Sort by",
          type: "total raised",
          options: [
            {
              label: "Total raised",
              items: ["Low", "High"],
              value: sortValue,
              setValue: setSorthValue,
            },
          ],
        }}
      />
      <ProjectsWrapper>
        {grid ? (
          GemsLabProjects.map((item, i) => {
            return (
              <ProjectCardLink href="/gemslab/accelerator/123" key={i}>
                <ProjectCardItem
                  type="gemslab"
                  //@ts-ignore
                  cardData={item}
                />
              </ProjectCardLink>
            );
          })
        ) : (
          <ViewTable
            type="gemslab"
            cardsData={{
              //@ts-ignore
              cards: GemsLabProjects.map((item) => ({
                ...item,
                onClick: () => router.push("/gemslab/accelerator/123"),
              })),
            }}
          />
        )}
        <Pagination
          page={page}
          total={20}
          limit={50}
          totalPage={20}
          onChange={(value) => setPage(value)}
        />
      </ProjectsWrapper>
    </PageWrapper>
  );
};

export default Projects;
