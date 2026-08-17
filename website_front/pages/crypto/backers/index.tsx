import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { ProjectPages } from "../../../staticContent/tabs";
import Backers from "../../../components/layouts/projects/Backers";

const BackersPage = () => {
  return (
    <Layout title="FOMO: Crypto/Backers">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <Backers />
    </Layout>
  );
};

export default BackersPage;
