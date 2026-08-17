import React, { useState } from "react";
import { LaunchpadPlacementBanner as PlacementBanner } from "../../../types/launchpadPlacements";

interface LaunchpadPlacementBannerProps {
  banner?: PlacementBanner;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
}

const safeImageUrl = (value?: string): string => {
  const url = String(value || "").trim();
  return /^(?:https?:\/\/|\/(?!\/))/i.test(url) ? url : "";
};

export const getLaunchpadBannerSources = (
  banner?: PlacementBanner
): { desktopUrl: string; mobileUrl: string } => {
  const desktopUrl = safeImageUrl(banner?.desktopUrl);
  const mobileUrl = safeImageUrl(banner?.mobileUrl);

  return {
    desktopUrl: desktopUrl || mobileUrl,
    mobileUrl: mobileUrl || desktopUrl,
  };
};

const LaunchpadPlacementBanner: React.FC<LaunchpadPlacementBannerProps> = ({
  banner,
  alt,
  className,
  loading = "lazy",
}) => {
  const [failed, setFailed] = useState(false);
  const { desktopUrl, mobileUrl } = getLaunchpadBannerSources(banner);

  if (!desktopUrl || failed) return null;

  return (
    <picture className={className}>
      <source media="(max-width: 767px)" srcSet={mobileUrl} />
      <img
        src={desktopUrl}
        alt={banner?.alt?.trim() || alt}
        loading={loading}
        onError={() => setFailed(true)}
      />
    </picture>
  );
};

export default LaunchpadPlacementBanner;
