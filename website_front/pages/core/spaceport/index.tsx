import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import { SpaceportPage } from "../../../components/layouts/spaceport";
import {
  withWalletPageGuard,
  withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection();

const Spaceport = () => {
  return (
    <Layout title="FomoLand: Utility/Spaceport">
      <Navigation project="utility" pagesList={UtilityPages} />
      <SpaceportPage />
    </Layout>
  );
};

export default withWalletPageGuard(Spaceport);
