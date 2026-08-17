import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { DashboardPages } from "../../staticContent/tabs";
import Projects from "../../components/layouts/dashboard/Projects";
import PageNotReady from "../../components/global/PageNotReady";

const ProjectsPage = () => {
  return (
    <Layout title="FomoLand: Dashboard">
      <Navigation project="dashboard" pagesList={DashboardPages} />
      {/* <Projects /> */}
      <PageNotReady />
    </Layout>
  );
};
export default ProjectsPage;
