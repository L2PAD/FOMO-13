import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { GemsLabPages } from "../../../staticContent/gemslab";
import Portfolio from "../../../components/layouts/gemslab/Portfolio";
import PageNotReady from "../../../components/global/PageNotReady";
import {
  withWalletPageGuard,
  withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection();

const AnalyticsPage = () => {
  return (
    <Layout title="FOMO: Core, Portfolio">
      <Navigation project="core" pagesList={GemsLabPages} />
      <Portfolio />
      {/* <PageNotReady/> */}
    </Layout>
  );
};
export default withWalletPageGuard(AnalyticsPage);
