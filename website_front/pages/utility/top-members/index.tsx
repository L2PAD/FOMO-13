import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import TopMembers from "../../../components/layouts/projects/OTC/TopMembers";
import {
  withWalletPageGuard,
  withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection();

const TopMembersPage = () => {
    return (
        <Layout title="FOMO: Top Members">
            <Navigation project="utility" pagesList={UtilityPages} />
            <TopMembers />
        </Layout>
    );
};

export default withWalletPageGuard(TopMembersPage);
