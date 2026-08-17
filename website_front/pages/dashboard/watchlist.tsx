import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { DashboardPages } from "../../staticContent/tabs";
import Watchlist from "../../components/layouts/dashboard/Watchlist";
import PageNotReady from "../../components/global/PageNotReady";

const Page = () => {
  return (
    <Layout title="FomoLand: Dashboard">
      <Navigation project="dashboard" pagesList={DashboardPages} />
      {/* <Watchlist /> */}
      <PageNotReady />
    </Layout>
  );
};
export default Page;
