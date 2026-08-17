import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import Calendar from "../../../components/layouts/projects/Calendar";
import { GemsLabPages } from "../../../staticContent/gemslab";
import PageNotReady from "../../../components/global/PageNotReady";
import {
    withWalletPageGuard,
    withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection();

const CalendarPage = () => {
    return (
        <Layout title="FOMO: Core">
            <Navigation project="core" pagesList={GemsLabPages} />
            <Calendar />
        </Layout>
    );
};
export default withWalletPageGuard(CalendarPage);
