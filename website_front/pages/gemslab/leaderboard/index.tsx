import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { GemsLabPages } from "../../../staticContent/gemslab";
import Leaderboard from "../../../components/layouts/gemslab/Leaderboard";
import PageNotReady from "../../../components/global/PageNotReady";

const Page = () => {
  return (
    <Layout title="FomoLand: GemsLab/Leaderboard">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      {/* <Leaderboard /> */}
      <PageNotReady />
    </Layout>
  );
};
export default Page;
