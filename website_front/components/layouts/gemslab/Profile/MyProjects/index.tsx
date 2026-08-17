import React, { FC } from "react";
import { useQuery } from "react-query";
import TableRow from "./table_row";
import { IProject, IUser } from "../../../../../types/global_types";
import fetchUserProjects from "../../../../../http/projects/fetchUserProjects";
import { useStyles } from "./styles";
import { EmptyLabel } from "../../../nfts/Projects/Project/NFTs/styles";
import deleteAction from "../../../../../http/actions/deleteAction";

const MyProjects = () => {
  const {
    wrapper,
    headerWrapper,
    projectsCell,
    statusCell,
    validationCell,
    investorsCell,
    raisedCell,
    fundingCell,
    typeCell,
    flagsCell,
  } = useStyles();
  const { data, refetch } = useQuery("projects", fetchUserProjects);

  const confirmDeleteAction = async (id: string): Promise<void> => {
    await deleteAction(id);
    refetch();
  };

  return (
    <div className={wrapper}>
      <div className={headerWrapper}>
        <div className={projectsCell}>Project</div>
        <div className={statusCell}>Status</div>
        <div className={validationCell}>Validation</div>
        <div className={investorsCell}>Investors</div>
        <div className={raisedCell}>Total Raised</div>
        <div className={fundingCell}>Last Funding</div>
        <div className={typeCell}>Type</div>
        <div className={flagsCell}>Red flags</div>
      </div>
      {data?.projects ? (
        data.projects.map((project: IProject) => {
          return (
            <TableRow
              confirmDeleteAction={confirmDeleteAction}
              project={project}
            />
          );
        })
      ) : (
        <EmptyLabel>Empty list...</EmptyLabel>
      )}
    </div>
  );
};

export default MyProjects;
