import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { GemsLabPages } from "../../../staticContent/gemslab";
import Project from "../../../components/layouts/gemslab/Projects/Project";
import PageNotReady from "../../../components/global/PageNotReady";

const ProjectPage = () => {
  return (
    <Layout title="FomoLand: GemsLab">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      {/* <Project /> */}
      <PageNotReady />
    </Layout>
  );
};
export default ProjectPage;
