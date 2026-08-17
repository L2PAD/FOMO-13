import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { GemsLabPages } from "../../../staticContent/gemslab";
import Vote from "../../../components/layouts/gemslab/Vote";
import PageNotReady from "../../../components/global/PageNotReady";
import {
    withWalletPageGuard,
    withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection();

const VotePage = () => {
    return (
        <Layout title="FomoLand: GemsLab">
            <Navigation project="gemslab" pagesList={GemsLabPages} />
            {/* <Vote /> */}
            <PageNotReady />
        </Layout>
    );
};
export default withWalletPageGuard(VotePage);
