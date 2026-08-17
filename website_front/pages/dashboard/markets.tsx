import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { DashboardPages } from "../../staticContent/tabs";
import Markets from "../../components/layouts/dashboard/Markets";
import PageNotReady from "../../components/global/PageNotReady";

const Page = () => {
  return (
    <Layout title="FomoLand: Dashboard">
      <Navigation project="dashboard" pagesList={DashboardPages} />
      {/* <Markets /> */}
      <PageNotReady />
    </Layout>
  );
};
export default Page;
