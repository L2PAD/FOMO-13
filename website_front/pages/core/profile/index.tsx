import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { GemsLabPages } from "../../../staticContent/gemslab";
import Profile from "../../../components/layouts/gemslab/Profile";
import {
  withWalletPageGuard,
  withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection();

const Page = () => {
  return (
    <Layout title="FOMO: Core, My Profile">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      <Profile />
    </Layout>
  );
};
export default withWalletPageGuard(Page);
