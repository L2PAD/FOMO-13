import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import News from "../../../components/layouts/gemslab/News";
import { GemsLabPages } from "../../../staticContent/gemslab";
import PageNotReady from "../../../components/global/PageNotReady";

const NewsPage = () => {
  return (
    <Layout title="FomoLand: GemsLab/News">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      {/* <News /> */}
      <PageNotReady />
    </Layout>
  );
};
export default NewsPage;
