import React from "react";
import { useRouter } from "next/router";
import Layout from "../../../../components/global/Layout";
import Navigation from "../../../../components/global/Navigation";
import {
  TelegramEntityOverview,
  XEntityOverview,
  DiscordEntityOverview,
  InstagramEntityOverview,
  LinkedInEntityOverview,
  TikTokEntityOverview,
  ThreadsEntityOverview,
} from "../../../../components/layouts/projects/InfluenceEntityOverview";
import { UtilityPages } from "../../../../staticContent/tabs";

const InfluenceEntityPage = () => {
  const router = useRouter();
  const { id, network } = router.query;

  const renderOverview = () => {
    switch (network) {
      case "x":
        return <XEntityOverview entityId={id as string} network={network} />;
      case "discord":
        return (
          <DiscordEntityOverview entityId={id as string} network={network} />
        );
      case "instagram":
        return (
          <InstagramEntityOverview entityId={id as string} network={network} />
        );
      case "linkedin":
        return (
          <LinkedInEntityOverview entityId={id as string} network={network} />
        );
      case "tiktok":
        return (
          <TikTokEntityOverview entityId={id as string} network={network} />
        );
      case "threads":
        return (
          <ThreadsEntityOverview entityId={id as string} network={network} />
        );
      case "telegram":
      default:
        return (
          <TelegramEntityOverview
            entityId={id as string}
            network={network as string}
          />
        );
    }
  };

  return (
    <Layout title="FomoLand: Influence Overview">
      <Navigation project="utility" pagesList={UtilityPages} />
      {renderOverview()}
    </Layout>
  );
};

export default InfluenceEntityPage;
