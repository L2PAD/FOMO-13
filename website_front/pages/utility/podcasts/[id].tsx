import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import Podcast from "../../../components/layouts/projects/Podcast";

const NTFsPage = () => {
  return (
    <Layout title="Fomoland: Projects">
      <Navigation project="utility" pagesList={UtilityPages} />
      <Podcast />
    </Layout>
  );
};

export default NTFsPage;
