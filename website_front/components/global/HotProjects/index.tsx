import React, { FC } from "react";
import { Body, Header, ListItem, Wrapper } from "./styles";
import { ArrowRightIcon } from "../Icons";
import EntityInfo from "../common/EntityInfo";
import { useQuery } from "react-query";
import fetchProjects from "../../../http/projects/fetchProjects";
import Placeholder from "../common/Placeholder";
import EmptyList from "../EmptyList";
import { IProject } from "../../../types/global_types";
import { clarifyAmount } from "../../../helpers/clarifyAmount";

const items = [
  {
    _id: "686d5ca50a980894b786e4a2",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca50a980894b786e4a7",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca60a980894b786e4ac",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca60a980894b786e4b0",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca60a980894b786e4ba",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca60a980894b786e4c2",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca60a980894b786e4c8",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
  {
    _id: "686d5ca60a980894b786e4cd",
    projectType: "market",
    projectStatus: "active",
    isDuplicate: false,
  },
];

interface IProps {
  isLoading: boolean;
  projects: Array<IProject>;
}

const HotProjects: FC<IProps> = ({ isLoading, projects }) => {
  return isLoading ? (
    <Placeholder height="100%" />
  ) : (
    <Body>
      {projects?.length ? (
        projects.slice(0, 5).map((item, i: number) => {
          return (
            <ListItem key={item._id}>
              <EntityInfo
                img={String(item.logo)}
                name={item.name}
                username={item.name}
                niche={item.niche}
                variant="default"
                isSponsored
                rating={Number(item.rating) > 100 ? 100 : Number(item.rating)}
              />
              <div className="info">
                <div className="info-item">
                  <div>Raised</div>
                  <span>${clarifyAmount(item.fundsRaised || 0)}</span>
                </div>
              </div>
            </ListItem>
          );
        })
      ) : (
        <>
          <br />
          <EmptyList />
        </>
      )}
    </Body>
  );
};

export default HotProjects;
