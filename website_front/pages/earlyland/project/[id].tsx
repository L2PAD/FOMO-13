import React, { createContext, FC } from "react";
import { useSelector } from "react-redux";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import {
  EarlylandLogoutPages,
  EarlylandPages,
} from "../../../staticContent/earlyland";
import Project from "../../../components/layouts/earlyland/Projects/Project";
import { authState } from "../../../store/slices/authSlice";
import fetchProjectById from "../../../http/projects/fetchProjectById";
import { IProject } from "../../../types/global_types";
import PageNotReady from "../../../components/global/PageNotReady";

export const getServerSideProps = async (context: any) => {
  const { id } = context.params;

  const { isSuccess, project } = await fetchProjectById(id);

  if (!isSuccess) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };
  }

  return { props: { project } };
};

interface IProps {
  project: IProject;
}

export const ProjectDataContext = createContext<IProject>({
  name: "",
  status: "Active",
  niche: "",
  totalRaised: "",
  rating: "",
  fullness: "",
  banner: "",
  lastFunding: new Date(),
  investors: [],
});

const NTFsPage: FC<IProps> = ({ project }) => {
  return (
    <ProjectDataContext.Provider value={project}>
      <Layout title="Fomoland: EarlyLand">
        <Navigation project="earlyland" pagesList={EarlylandPages} />
        {/* <Project /> */}
        <PageNotReady />
      </Layout>
    </ProjectDataContext.Provider>
  );
};

export default NTFsPage;
