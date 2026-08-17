import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import FomoChat from "../../../components/layouts/projects/FomoChat";
import { GemsLabPages } from "../../../staticContent/gemslab";
import {
  withWalletPageGuard,
  withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection();

const FomoChatPage = () => {
  return (
    <Layout title="FomoLand: FOMO Chat">
      <Navigation project="core" pagesList={GemsLabPages} />
      <FomoChat />
    </Layout>
  );
};

export default withWalletPageGuard(FomoChatPage);
