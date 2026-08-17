import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import PodcastsList from "../../../components/layouts/projects/PodcastsList";
import PageNotReady from "../../../components/global/PageNotReady";

const PodcastsPage = () => {
  return (
    <Layout title="FomoLand: Utility/Podcasts">
      <Navigation project="utility" pagesList={UtilityPages} />
      {/* <PodcastsList /> */}
      <PageNotReady />
    </Layout>
  );
};

export default PodcastsPage;
