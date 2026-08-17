import React from "react";
import Navigation from "../../../components/global/Navigation";
import { ProjectPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import Backers from "../../../components/layouts/projects/Backers";

const FundsPage = () => {
  return (
    <Layout title="FOMO: Crypto">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <Backers defaultTab="Funds" />
    </Layout>
  );
};
export default FundsPage;
