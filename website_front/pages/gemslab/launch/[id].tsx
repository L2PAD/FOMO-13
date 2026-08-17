import React, { createContext, FC } from "react";
import { GemsLabPages } from "../../../staticContent/gemslab";
import { IProject } from "../../../types/global_types";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import AcceleratorProject from "../../../components/layouts/gemslab/Accelerator/Project";
import fetchProjectById from "../../../http/projects/fetchProjectById";
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

const AcceleratorIdPage: FC<IProps> = ({ project }) => {
  return (
    <ProjectDataContext.Provider value={project}>
      <Layout title="FomoLand: GemsLab">
        <Navigation project="gemslab" pagesList={GemsLabPages} />
        {/* <AcceleratorProject /> */}
        <PageNotReady />
      </Layout>
    </ProjectDataContext.Provider>
  );
};
export default AcceleratorIdPage;
