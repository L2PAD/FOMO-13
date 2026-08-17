import React, { FC } from "react";
import Navigation from "../../../../components/global/Navigation";
import { UtilityPages } from "../../../../staticContent/tabs";
import Layout from "../../../../components/global/Layout";
import Collection from "../../../../components/layouts/gemslab/Market/Collection";
import fetchCollectionById from "../../../../http/collections/fetchCollectionById";
import { ICollection } from "../../../../types/global_types";
import {
  withWalletPageGuard,
  withWalletPageProtection,
} from "../../../../helpers/walletPageGuard";

export const getServerSideProps = withWalletPageProtection(async (context: any) => {
  const { id } = context.params;

  const { isSuccess, collection } = await fetchCollectionById(id);

  if (!isSuccess) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };
  }

  return { props: { collection } };
});

interface IProps {
  collection: ICollection;
}

const Page: FC<IProps> = ({ collection }) => {
  return (
    <Layout title="FomoLand: Market/Project">
      <Navigation project="utility" pagesList={UtilityPages} />
      <Collection collection={collection} />
    </Layout>
  );
};

export default withWalletPageGuard(Page);
