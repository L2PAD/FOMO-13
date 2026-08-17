import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import { Arena } from "../../../components/layouts/arena";

const ArenaPage = () => {
  return (
    <Layout title="FomoLand: Utility/Arena">
      <Navigation project="utility" pagesList={UtilityPages} />
      {/* <PodcastsList /> */}
      <Arena />
    </Layout>
  );
};

export default ArenaPage;
