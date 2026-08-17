import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import PageNotReady from "../../../components/global/PageNotReady";

const OnChainPage = () => {
  return (
    <Layout title="FomoLand: Utility/On-Chain">
      <Navigation project="utility" pagesList={UtilityPages} />
      {/* <PodcastsList /> */}
      <PageNotReady />
    </Layout>
  );
};

export default OnChainPage;
