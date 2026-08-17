import React, { useMemo, useState } from "react";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import { IProject } from "../../../../../types/global_types";
import { LaunchpadPlacementSurface } from "../../../../../types/launchpadPlacements";
import {
  isLaunchpadPlacementCryptoProject,
  toLaunchpadPlacementCryptoProject,
} from "../../../../../helpers/launchpadPlacements";
import useLaunchpadPlacements from "../../../../../hooks/useLaunchpadPlacements";
import Placeholder from "../../../../global/common/Placeholder";
import { ProjectCardItem } from "../styles";
import useSponsoredProjects from "../useSponsoredProjects";
import {
  Title,
  Wrapper,
  Items,
  ArrowsWrapper,
  PlaceholdersRow,
  SpotlightLink,
  SpotlightBanner,
  SpotlightState,
  SpotlightRetryButton,
  SpotlightPlacementBadges,
  SpotlightPlacementBadge,
} from "./styles";
import { useTranslation } from "i18n";

interface FomoSpotlightProps {
  placementSurface?: LaunchpadPlacementSurface;
}

const FomoSpotlight = ({ placementSurface }: FomoSpotlightProps) => {
  const { translateText } = useTranslation();
  const sponsoredProjectsQuery = useSponsoredProjects({
    enabled: !placementSurface,
  });
  const placementQuery = useLaunchpadPlacements({
    surface: placementSurface || "crypto_projects",
    limit: 30,
    offset: 0,
    enabled: Boolean(placementSurface),
  });
  const projects = useMemo<IProject[]>(
    () =>
      placementSurface
        ? (placementQuery.data?.items || [])
            .filter((placement) => placement.featured === true)
            .map(toLaunchpadPlacementCryptoProject)
        : sponsoredProjectsQuery.data?.projects || [],
    [
      placementQuery.data?.items,
      placementSurface,
      sponsoredProjectsQuery.data?.projects,
    ]
  );
  const isLoading = placementSurface
    ? placementQuery.isLoading
    : sponsoredProjectsQuery.isLoading;
  const isError = placementSurface
    ? placementQuery.isError
    : sponsoredProjectsQuery.isError;
  const [swiper, setSwiper] = useState<any>(null);
  const [isDescription, setIsDescription] = useState<boolean>(false);
  const [isHover, setIsHover] = useState<boolean>(false);

  return (
    <Wrapper>
      <Title>
        <span className="title-wrapper">{translateText("FOMO Spotlight")}</span>
        <button
          onMouseEnter={() => setIsDescription(true)}
          onMouseLeave={() => setIsDescription(false)}
        >
          <InfoIcon />
        </button>
        <DescriptionComponent
          className="eralash-description"
          isVisible={isDescription}
          date={new Date()}
          isDate={false}
          text={`<div>${translateText(
            "Don't miss these top-promoted projects, handpicked for visibility"
          )}</div>`}
        />
      </Title>
      {isLoading ? (
        <PlaceholdersRow>
          <Placeholder height="180px" />
          <Placeholder height="180px" />
          <Placeholder height="180px" />
        </PlaceholdersRow>
      ) : isError ? (
        <SpotlightState role="alert">
          <span>
            {translateText(
              placementSurface
                ? "Featured launchpad projects are unavailable"
                : "Sponsored projects are unavailable"
            )}
          </span>
          <SpotlightRetryButton
            type="button"
            onClick={() =>
              placementSurface
                ? placementQuery.refetch()
                : sponsoredProjectsQuery.refetch()
            }
          >
            {translateText("Try again")}
          </SpotlightRetryButton>
        </SpotlightState>
      ) : projects.length === 0 ? (
        <SpotlightState>
          {translateText(
            placementSurface
              ? "No featured launchpad projects"
              : "No sponsored projects"
          )}
        </SpotlightState>
      ) : (
        <Items
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
        >
          <Swiper
            modules={[Autoplay, Navigation]}
            spaceBetween={20}
            slidesPerView={3}
            onSwiper={setSwiper}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            loop={projects.length > 1}
            breakpoints={{
              320: {
                slidesPerView: 1,
              },
              768: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
          >
            {projects.map((item: IProject, i: number) => (
              <SwiperSlide key={`${item._id}${i}`}>
                {isLaunchpadPlacementCryptoProject(item) ? (
                  <SpotlightLink href={item._placementHref}>
                    <SpotlightBanner
                      banner={item._placementBanner}
                      alt={`${item.name || "Launchpad project"} banner`}
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                    {(item._placementAd || item._placementFeatured) && (
                      <SpotlightPlacementBadges>
                        {item._placementAd && (
                          <SpotlightPlacementBadge>
                            {translateText("Ad")}
                          </SpotlightPlacementBadge>
                        )}
                        {item._placementFeatured && (
                          <SpotlightPlacementBadge>
                            {translateText("Featured")}
                          </SpotlightPlacementBadge>
                        )}
                      </SpotlightPlacementBadges>
                    )}
                    <ProjectCardItem
                      type="spotlight"
                      cardData={{ ...item, isSponsored: item._placementAd }}
                    />
                  </SpotlightLink>
                ) : (
                  <ProjectCardItem
                    type="spotlight"
                    cardData={{ ...item, isSponsored: true }}
                  />
                )}
              </SwiperSlide>
            ))}
          </Swiper>
          {isHover && swiper && (
            <ArrowsWrapper>
              <button onClick={() => swiper.slidePrev()}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M15 4.5L7.5 12L15 19.5"
                    stroke="#738094"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button onClick={() => swiper.slideNext()}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M9 4.5L16.5 12L9 19.5"
                    stroke="#738094"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </ArrowsWrapper>
          )}
        </Items>
      )}
    </Wrapper>
  );
};

export default FomoSpotlight;
