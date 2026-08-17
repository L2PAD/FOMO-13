import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import Bazaar from "../../components/layouts/projects/OTC";
import { UtilityPages } from "../../staticContent/tabs";
import {
  withWalletPageGuard,
  withWalletPageProtection,
} from "../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection();

const BazzarPage = () => {
  return (
    <Layout title="FOMO: Utility/Bazzar">
      <Navigation project="utility" pagesList={UtilityPages} />
      <Bazaar />
    </Layout>
  );
};
export default withWalletPageGuard(BazzarPage);
