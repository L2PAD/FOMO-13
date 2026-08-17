import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { ProjectPages } from "../../../staticContent/tabs";
import Projects from "../../../components/layouts/projects/Crypto";

const ProjectsPage = () => {
  return (
    <Layout title="FOMO: Crypto/Projects">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <Projects />
    </Layout>
  );
};
export default ProjectsPage;
