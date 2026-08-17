import React, { FC } from "react";
import UserAvatar from "../common/UserAvatar";
import {
  ProjectDescription,
  ProjectItemWrapper,
  ProjectLeftWrapper,
  ProjectsWrapper,
  ProjectTitle,
  ProjectValue,
  Title,
  ViewItemWrapper,
} from "./styles";

interface Props {
  title: string;
  projects: {
    avatar: string;
    name: string;
    description: string;
    value: string;
    variant: "green" | "red" | "default";
  }[];
}

const TopView: FC<Props> = ({ title, projects }) => {
  return (
    <ViewItemWrapper variant="default">
      <Title variant="p">{title}</Title>
      <ProjectsWrapper>
        {projects.map((item, i) => {
          return (
            <ProjectItemWrapper key={i}>
              <ProjectLeftWrapper>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar={item.avatar}
                  name={item.avatar}
                />
                <div>
                  <ProjectTitle variant="p">{item.name}</ProjectTitle>
                  <ProjectDescription variant="p">
                    {item.description}
                  </ProjectDescription>
                </div>
                <ProjectValue variant="p" color={item.variant}>
                  {item.value}
                </ProjectValue>
              </ProjectLeftWrapper>
            </ProjectItemWrapper>
          );
        })}
      </ProjectsWrapper>
    </ViewItemWrapper>
  );
};

export default TopView;
