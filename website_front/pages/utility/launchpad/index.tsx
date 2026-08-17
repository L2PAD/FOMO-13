import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import { LaunchpadPage } from "../../../components/layouts/launchpad";
import {
  withWalletPageGuard,
  withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection();

const Launchpad = () => {
  return (
    <Layout title="FomoLand: Utility/Launchpad">
      <Navigation project="utility" pagesList={UtilityPages} />
      <LaunchpadPage />
    </Layout>
  );
};

export default withWalletPageGuard(Launchpad);
