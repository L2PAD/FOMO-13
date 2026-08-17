import React from "react";
import { useRouter } from "next/router";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { ProjectPages } from "../../staticContent/tabs";
import CustomTabPage from "../../components/layouts/projects/CryptoMarket/custom-tab-page";

const TabPage = () => {
  const router = useRouter();

  return (
    <Layout title="FomoLand: Crypto/Tab">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <CustomTabPage
        id={String(router.query.id)}
        tabType={String(router.query.tab)}
      />
    </Layout>
  );
};
export default TabPage;
