import React from "react";
import Navigation from "../../components/global/Navigation";
import Layout from "../../components/global/Layout";
import Tasks from "../../components/layouts/nfts/Tasks";
import { NFTsPages } from "../../staticContent/nfts/global";
import PageNotReady from "../../components/global/PageNotReady";

const TasksPage = () => {
  return (
    <Layout title="Fomoland: NFT's">
      <Navigation project="nfts" pagesList={NFTsPages} />
      {/* <Tasks /> */}
      <PageNotReady />
    </Layout>
  );
};

export default TasksPage;
