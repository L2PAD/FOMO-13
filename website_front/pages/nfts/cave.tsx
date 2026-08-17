import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import Cave from "../../components/layouts/Cave";
import { NFTsPages } from "../../staticContent/nfts/global";
import PageNotReady from "../../components/global/PageNotReady";

const CalendarPage = () => {
  return (
    <Layout title="Fomoland: NFTs">
      <Navigation project="nfts" pagesList={NFTsPages} />
      {/* <Cave /> */}
      <PageNotReady />
    </Layout>
  );
};
export default CalendarPage;
