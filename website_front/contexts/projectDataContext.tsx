import { createContext } from "react";
import { IProject } from "../types/global_types";

export interface IProjectWithRefetch extends IProject {
  refetch: () => void;
}

export const defaultProjectData: IProjectWithRefetch = {
  name: "",
  status: "Active",
  niche: "",
  totalRaised: "",
  rating: "",
  fullness: "",
  banner: "",
  lastFunding: new Date(),
  investors: [],
  refetch: () => {},
};

export const ProjectDataContext =
  createContext<IProjectWithRefetch>(defaultProjectData);
