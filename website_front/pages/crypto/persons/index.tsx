import React from "react";
import Navigation from "../../../components/global/Navigation";
import { ProjectPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import Backers from "../../../components/layouts/projects/Backers";

const PersonsPage = () => {
  return (
    <Layout title="FOMO: Crypto/Persons">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <Backers defaultTab="Persons" />
    </Layout>
  );
};

export default PersonsPage;
