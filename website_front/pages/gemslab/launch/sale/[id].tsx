import React, { createContext, FC } from "react";
import Layout from "../../../../components/global/Layout";
import Navigation from "../../../../components/global/Navigation";
import { GemsLabPages } from "../../../../staticContent/gemslab";
import Sale from "../../../../components/layouts/gemslab/Sale";
import fetchProjectById from "../../../../http/projects/fetchProjectById";
import { IProject } from "../../../../types/global_types";

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

export const ProjectSaleContext = createContext<IProject>({
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

const SalePage: FC<IProps> = ({ project }) => {
  return (
    <ProjectSaleContext.Provider value={project}>
      <Layout title="FomoLand: GemsLab">
        <Navigation project="gemslab" pagesList={GemsLabPages} />
        <Sale />
      </Layout>
    </ProjectSaleContext.Provider>
  );
};
export default SalePage;
