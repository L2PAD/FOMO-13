import React, { FC } from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import LaunchpadProjectDetail from "../../../components/layouts/launchpad/LaunchpadProjectDetail";
import {
  withWalletPageGuard,
  withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection(
  async (context: any) => {
    const { id } = context.params;
    return { props: { id } };
  }
);

interface IProps {
  id: string;
}

const NTFsPage: FC<IProps> = ({ id }) => {
  return (
    <Layout title="FomoLand: Utility/Launchpad">
      <Navigation project="utility" pagesList={UtilityPages} />
      <LaunchpadProjectDetail id={id} />
    </Layout>
  );
};

export default withWalletPageGuard(NTFsPage);
