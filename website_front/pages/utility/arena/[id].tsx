import React from "react";
import { useRouter } from "next/router";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import { PredictionDetails } from "../../../components/layouts/arena/prediction-details";

const PredictionDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  return (
    <Layout title="FomoLand: Utility/Arena/Prediction">
      <Navigation project="utility" pagesList={UtilityPages} />
      <PredictionDetails predictionId={id as string} />
    </Layout>
  );
};

export default PredictionDetailsPage;
