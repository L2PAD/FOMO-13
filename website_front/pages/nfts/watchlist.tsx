import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { NFTsPages } from "../../staticContent/nfts/global";
import Watchlist from "../../components/layouts/nfts/Watchlist";
import PageNotReady from "../../components/global/PageNotReady";

const WatchlistPage = () => {
  return (
    <Layout title="Fomoland: NFTs">
      <Navigation project="nfts" pagesList={NFTsPages} />
      {/* <Watchlist /> */}
      <PageNotReady />
    </Layout>
  );
};

export default WatchlistPage;
