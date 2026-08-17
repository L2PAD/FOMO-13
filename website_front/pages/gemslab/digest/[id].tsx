import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { GemsLabPages } from "../../../staticContent/gemslab";
import DigestItemPage from "../../../components/layouts/projects/News/DigestItemPage";

const DigestPage = () => {
  return (
    <Layout title="FomoLand: GemsLab/Market Digest">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      <DigestItemPage />
    </Layout>
  );
};
export default DigestPage;
