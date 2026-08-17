import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { ProjectPages } from "../../staticContent/tabs";
import FundingFeed from "../../components/layouts/projects/FundingFeed";

const FundingFeedPage = () => {
  return (
    <Layout title="Fomoland: Crypto/Funding Feed">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <FundingFeed />
    </Layout>
  );
};
export default FundingFeedPage;
