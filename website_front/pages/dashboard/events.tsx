import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { DashboardPages } from "../../staticContent/tabs";
import Events from "../../components/layouts/dashboard/Events";
import PageNotReady from "../../components/global/PageNotReady";

const Page = () => {
  return (
    <Layout title="FomoLand: Dashboard">
      <Navigation project="dashboard" pagesList={DashboardPages} />
      {/* <Events /> */}
      <PageNotReady />
    </Layout>
  );
};
export default Page;
