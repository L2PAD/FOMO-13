import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import PageNotReady from "../../../components/global/PageNotReady";

const DashPage = () => {
  return (
    <Layout title="FomoLand: Utility/Dash">
      <Navigation project="utility" pagesList={UtilityPages} />
      {/* <PodcastsList /> */}
      <PageNotReady />
    </Layout>
  );
};

export default DashPage;
