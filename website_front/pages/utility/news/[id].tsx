import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { ProjectPages } from "../../../staticContent/tabs";
import NewsItemPage from "../../../components/layouts/projects/News/NewsItemPage";

const NewsPage = () => {
  return (
    <Layout title="Fomoland: Crypto/News">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <NewsItemPage />
    </Layout>
  );
};
export default NewsPage;
