import React, { FC, useContext, useState } from "react";
import { useQuery } from "react-query";
import { ProjectsProjectsCards } from "../../../../../../staticContent/projects/projects";
import fetchProjects from "../../../../../../http/projects/fetchProjects";
import { IProject } from "../../../../../../types/global_types";
import { ProjectDataContext } from "../../../../../../contexts/projectDataContext";
import AddProjectsModal from "../../../modals/AddProjectsModal";
import {
  TableWrapper,
  Wrapper,
  PageDescription,
  PageDescriptionWrapper,
  ProjectCardItem,
  ProjectCardLink,
  EditBtnWrapper,
} from "./styles";
import EditItemsButton from "../../../../../global/common/EditItemsButton";

interface IProps {
  isEditState: boolean;
  project: IProject | null;
  inputsHandler: (name: string, value: any) => void;
}

const EndedComparison: FC<IProps> = ({
  isEditState,
  project,
  inputsHandler,
}) => {
  const { data } = useQuery("all-projects", () => fetchProjects(`all/active`));
  const [isAddProject, setIsAddProject] = useState(false);
  const staticProject: IProject = useContext(ProjectDataContext);

  const confirmAddProjects = async (
    projectsIds: Array<string>
  ): Promise<void> => {
    const selectedProjects: Array<IProject> =
      data?.projects?.filter((item: IProject) => {
        return projectsIds.includes(String(item._id));
      }) || [];

    inputsHandler("comparison", selectedProjects);

    setIsAddProject(false);
  };

  return (
    <>
      <Wrapper>
        <PageDescriptionWrapper>
          <PageDescription variant="p">
            View and compare key project information, including its current
            status, latest funding rounds, tokenomics, and upcoming events such
            as token sales. Assess project potential, compare their performance,
            and make well-informed investment decisions based on a detailed
            analysis of the provided data.
          </PageDescription>
        </PageDescriptionWrapper>
        {isEditState ? (
          <EditBtnWrapper>
            <EditItemsButton
              onClick={() => setIsAddProject(true)}
              type="comparison"
            />
          </EditBtnWrapper>
        ) : (
          <></>
        )}
        <TableWrapper>
          {isEditState
            ? project?.comparison?.map((item: IProject, i) => {
                return (
                  <ProjectCardLink href="/crypto/project/123" key={item._id}>
                    <ProjectCardItem
                      type="default"
                      //@ts-ignore
                      cardData={item}
                    />
                  </ProjectCardLink>
                );
              })
            : staticProject?.comparison?.map((item: IProject, i) => {
                return (
                  <ProjectCardLink href="/crypto/project/123" key={item._id}>
                    <ProjectCardItem
                      type="default"
                      //@ts-ignore
                      cardData={item}
                    />
                  </ProjectCardLink>
                );
              })}
        </TableWrapper>
      </Wrapper>
      {isAddProject ? (
        <AddProjectsModal
          projects={project?.comparison || []}
          data={{ projects: data?.projects || [] }}
          modalType="projects"
          onSubmit={confirmAddProjects}
          onClose={() => setIsAddProject(false)}
        />
      ) : (
        <></>
      )}
    </>
  );
};

export default EndedComparison;
