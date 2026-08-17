import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { GemsLabPages } from "../../staticContent/gemslab";
import Market from "../../components/layouts/gemslab/Market";
import PageNotReady from "../../components/global/PageNotReady";

const MarketPage = () => {
  return (
    <Layout title="FomoLand: GemsLab">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      <PageNotReady />
    </Layout>
  );
};
export default MarketPage;
