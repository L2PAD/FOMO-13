import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { DashboardPages } from "../../staticContent/tabs";
import Backers from "../../components/layouts/dashboard/Backers";
import PageNotReady from "../../components/global/PageNotReady";

const Page = () => {
  return (
    <Layout title="FomoLand: Dashboard">
      <Navigation project="dashboard" pagesList={DashboardPages} />
      {/* <Backers /> */}
      <PageNotReady />
    </Layout>
  );
};
export default Page;
