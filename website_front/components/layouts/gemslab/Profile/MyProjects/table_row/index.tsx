import React, { useState, useCallback } from "react";
import { useStyles } from "./styles";
import StatusTag from "../../../../../global/StatusTag";
import { RedFlags } from "../../../../../global/Tables/ActionsTable/ProjectsTable/Header/styles";
import { Rating } from "../../../../dashboard/components/Rating";
import Button from "../../../../../global/common/Button";
import { STATUS_LIST, IProject } from "../../../../../../types/global_types";
import imageLoader from "../../../../../../helpers/imageLoader";
import parseDate from "../../../../../../helpers/parseDate";
import Loader from "../../../../../global/loader";

import Link from "next/link";
import RedFlag from "../../../../../global/RedFlag";
import DotsButtonWithDropdown from "../../../../../global/DotsButtonWithDropdown";
import getProjectStatus from "../../../../../../helpers/getProjectStatus";
import upperCaseFirstLetter from "../../../../../../helpers/upperCaseFirstLetter";
import {
  InvestorsText,
  InvestorsWrapper,
} from "../../../../../global/ViewCard/styles";
import UsersRow from "../../../../../global/UsersRow";

const TableRow = ({
  project,
  confirmDeleteAction,
}: {
  project: any;
  confirmDeleteAction: (id: string) => Promise<void>;
}) => {
  const {
    wrapper,
    rowWrapper,
    projectWrapper,
    projectImage,
    statusWrapper,
    investorsWrapper,
    ratingWrapper,
    raisedWrapper,
    tagWrapper,
    typeWrapper,
    actionsWrapper,
    flagsWrapper,
    fundingWrapper,
    projectTitle,
    projectDescription,
    tagCircle,
    validationCell,
    projectDuplicate,
  } = useStyles({
    status: project.redStatus,
    rating: 75,
    projectStatus: getProjectStatus(project.status),
  });

  return (
    <div className={wrapper}>
      <div className={`${rowWrapper} container`}>
        <Link
          href={`/projects/project/${project._id}`}
          className={projectWrapper}
        >
          <img
            className={projectImage}
            src={imageLoader(project.logo)}
            alt="name"
          />
          <div>
            <div className={projectTitle}>
              {project.name}
              <span>{project.fullness ? project.fullness : "0%"}</span>
            </div>
            <div className={projectDescription}>
              {project.niche ? project.niche : "-"}
            </div>
          </div>
          {/* {
                            project.isDuplicate 
                            ?
                            <div className={projectDuplicate}>
                                Duplicate
                            </div>
                            :
                            <></>
                        } */}
        </Link>
        <div className={statusWrapper}>
          <span>{upperCaseFirstLetter(project.status)}</span>
        </div>
        <div className={`${validationCell} ${project.projectStatus}`}>
          {upperCaseFirstLetter(project.projectStatus)}
        </div>
        <div className={investorsWrapper}>
          <InvestorsWrapper>
            <UsersRow users={project.investors} />
            <InvestorsText variant="p">
              Total:{" "}
              <span>
                {project.investors.length}{" "}
                {project.investors.length > 1 ? "investors" : "investor"}
              </span>
            </InvestorsText>
          </InvestorsWrapper>
          {/* <InvestorsRow investors={project.investors ? project.investors : []}/> */}
        </div>
        <div className={raisedWrapper}>
          {project.totalRaised ? `$${project.totalRaised}` : "-"}
        </div>
        <div className={fundingWrapper}>
          {/* {project.lastFunding ? parseDate(project.lastFunding) : '-'} */}
        </div>
        <div className={typeWrapper}>{project.type ? project.type : "-"}</div>
        <div className={tagWrapper}>
          <div className={tagCircle} />
          {project.banner ? project.banner : "-"}
        </div>
        <div className={flagsWrapper}>
          <RedFlag count={project.redFlagsList.length} />
        </div>
        <div className={ratingWrapper}>
          {/* <Rating rating={project.rating ? Number(project.rating) : 0} /> */}
        </div>
        {project.projectStatus.toLowerCase() !== "active" ? (
          <div className={actionsWrapper}>
            <DotsButtonWithDropdown
              items={[
                {
                  title: "Delete",
                  onClick: () => confirmDeleteAction(project._id),
                },
              ]}
            />
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default TableRow;
