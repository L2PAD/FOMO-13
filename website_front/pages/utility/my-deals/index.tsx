import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import MyDeals from "../../../components/layouts/projects/OTC/MyDeals";
import {
  withWalletPageGuard,
  withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection();

const MyDealsPage = () => {
    return (
        <Layout title="FOMO: My Deals">
            <Navigation project="utility" pagesList={UtilityPages} />
            <MyDeals />
        </Layout>
    );
};

export default withWalletPageGuard(MyDealsPage);
