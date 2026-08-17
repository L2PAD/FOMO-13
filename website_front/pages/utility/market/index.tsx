import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";

import Market from "../../../components/layouts/gemslab/Market";
import {
  withWalletPageGuard,
  withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection();

const Page = () => {
  return (
    <Layout title="FomoLand: Market">
      <Navigation project="utility" pagesList={UtilityPages} />
      <Market />
    </Layout>
  );
};

export default withWalletPageGuard(Page);
