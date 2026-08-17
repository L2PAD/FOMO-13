import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { GemsLabPages } from "../../../staticContent/gemslab";
import Watchlist from "../../../components/layouts/projects/Watchlist";
import PageNotReady from "../../../components/global/PageNotReady";
import {
    withWalletPageGuard,
    withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection();

const WatchlistPage = () => {
    return (
        <Layout title="FOMO: GemsLab">
            <Navigation project="gemslab" pagesList={GemsLabPages} />
            <Watchlist />
        </Layout>
    );
};

export default withWalletPageGuard(WatchlistPage);
