import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import NewsItemPage from "../../../components/layouts/projects/News/NewsItemPage";
import { GemsLabPages } from "../../../staticContent/gemslab";
import PageNotReady from "../../../components/global/PageNotReady";

const NewsPage = () => {
  return (
    <Layout title="FomoLand: GemsLab/News">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      {/* <NewsItemPage /> */}
      <PageNotReady />
    </Layout>
  );
};
export default NewsPage;
