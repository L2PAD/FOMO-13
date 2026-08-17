import React from "react";
import Watchlist from "../../components/layouts/projects/Watchlist";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { ProjectPages } from "../../staticContent/tabs";

const WatchlistPage = () => {
  return (
    <Layout title="FomoLand: Crypto/Watchlist">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <Watchlist />
    </Layout>
  );
};
export default WatchlistPage;
