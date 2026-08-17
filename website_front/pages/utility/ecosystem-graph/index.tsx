import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import Connection from "../../../components/layouts/projects/Connection";

const ConnectionPage = () => {
  return (
    <Layout title="FomoLand: Connection">
      <Navigation project="utility" pagesList={UtilityPages} />
      <Connection />
    </Layout>
  );
};

export default ConnectionPage;
