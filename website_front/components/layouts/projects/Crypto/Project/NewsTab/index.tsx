import React, { FC, useContext } from "react";
import News from "../../../../../global/News";
import { Wrapper } from "./styles";
import { ProjectDataContext } from "../../../../../../contexts/projectDataContext";
import { IProject } from "../../../../../../types/global_types";
import EmptySection from "../../../../../global/EmptySection";
import { useTranslation } from "i18n";

const NewsTab: FC<{ project: IProject }> = ({ project }) => {
  const { translateText } = useTranslation();

  return (
    <Wrapper>
      <h2>{translateText("Live News")}</h2>
      {project?.projectTwitterData?.tweets?.length ? (
        <News
          project={project}
          items={project.projectTwitterData?.tweets || []}
        />
      ) : (
        <EmptySection />
      )}
    </Wrapper>
  );
};

export default NewsTab;
