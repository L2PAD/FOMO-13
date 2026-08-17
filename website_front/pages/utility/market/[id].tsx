import React, { FC } from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import Project from "../../../components/layouts/gemslab/Market/Project";
import { ICollectionNft } from "../../../types/global_types";
import fetchNftById from "../../../http/collections/fetchNftById";
import {
  withWalletPageGuard,
  withWalletPageProtection,
} from "../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection(async (context: any) => {
  const { id } = context.params;

  const { isSuccess, nft } = await fetchNftById(id);

  if (!isSuccess) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };
  }

  return { props: { nft } };
});

interface IProps {
  nft: ICollectionNft;
}

const Page: FC<IProps> = ({ nft }) => {
  return (
    <Layout title="FomoLand: Market/Project">
      <Navigation project="utility" pagesList={UtilityPages} />
      <Project nftData={nft} />
    </Layout>
  );
};

export default withWalletPageGuard(Page);
