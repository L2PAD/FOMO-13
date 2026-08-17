import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import News from "../../../components/layouts/projects/News";

const NewsPage = () => {
  return (
    <Layout title="FOMO: Utility/News">
      <Navigation project='utility' pagesList={UtilityPages} />
      <News />
    </Layout>
  );
};
export default NewsPage;
