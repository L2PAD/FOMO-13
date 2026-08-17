import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { ProjectPages } from "../../../staticContent/tabs";
import DigestItemPage from "../../../components/layouts/projects/News/DigestItemPage";

const DigestPage = () => {
  return (
    <Layout title="Fomoland: Market Digest">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <DigestItemPage />
    </Layout>
  );
};
export default DigestPage;
