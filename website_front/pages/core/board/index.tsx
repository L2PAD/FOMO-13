import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import {
    EarlylandLogoutPages,
    EarlylandPages,
} from "../../../staticContent/earlyland";
import BoardLayout from "../../../components/layouts/earlyland/Board";
import PageNotReady from "../../../components/global/PageNotReady";
import {
    withWalletPageGuard,
    withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection();

const BoardPage = () => {
    return (
        <Layout title="Fomoland: EarlyLand">
            <Navigation project="earlyland" pagesList={EarlylandPages} />
            {/* <BoardLayout /> */}
            <PageNotReady />
        </Layout>
    );
};
export default withWalletPageGuard(BoardPage);
