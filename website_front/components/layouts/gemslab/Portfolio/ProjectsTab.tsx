import React, { useState } from "react";
import { GemsLabProjects } from "../../../../staticContent/gemslab";
import Pagination from "../../../global/Pagintaion";
import { ProjectCardItem, ProjectCardLink, ProjectsWrapper } from "./styles";
import Dashboard from "./Dashboard";

const ProjectsTab = () => {
  const [page, setPage] = useState(1);
  return (
    <>
      <ProjectsWrapper>
        {GemsLabProjects.map((item, i) => {
          if (i <= 8) {
            return (
              <ProjectCardLink href="/gemslab/project/123" key={i}>
                <ProjectCardItem
                  type="gemslab"
                  //@ts-ignore
                  cardData={item}
                />
              </ProjectCardLink>
            );
          }

          return null;
        })}
        <Pagination
          page={page}
          total={20}
          limit={50}
          totalPage={20}
          onChange={(value) => setPage(value)}
        />
      </ProjectsWrapper>
      <Dashboard />
    </>
  );
};

export default ProjectsTab;
