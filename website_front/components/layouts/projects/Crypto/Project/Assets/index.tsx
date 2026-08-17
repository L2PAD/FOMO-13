import React, { FC, useContext, useState, useEffect } from "react";
import { StarIcon } from "../../../../../global/Icons";
import {
  Asset,
  Assets,
  Header,
  PriceInfo,
  ProjectData,
  Wrapper,
} from "./styles";
import { ProjectDataContext } from "../../../../../../contexts/projectDataContext";
import UserAvatar from "../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../helpers/imageLoader";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import PercentValue from "../../../../../global/common/PercentValue";
import { IProject } from "../../../../../../types/global_types";
import { useQuery } from "react-query";
import fetchProjects from "../../../../../../http/projects/fetchProjects";
import EmptySection from "../../../../../global/EmptySection";
import {
  AuthContext,
  LocationContext,
  WatchlistContext,
} from "../../../../../global/Layout";
import { toast } from "react-toastify";
import deleteFromWatchlist from "../../../../../../http/watchlist/deleteFromWatchlist";
import addProjectToWatchlist from "../../../../../../http/watchlist/addProjectToWatchlist";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import { useTranslation } from "i18n";
import { useRouter } from "next/router";

const TrendingAssets: FC<{ project?: IProject }> = () => {
  const { translateText } = useTranslation();
  const router = useRouter();
  const { watchlist, refetch } = useContext(WatchlistContext);
  const { userData, isAuth } = useContext(AuthContext);
  const { path } = useContext(LocationContext);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 991);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { data, isLoading } = useQuery(
    ["trending-assets"],
    () =>
      fetchProjects("category/trending", "", "", "", {
        source: "fomo-v2",
      }),
    {
      refetchOnWindowFocus: false,
    }
  );

  const getMarketPath = (item: any): string => {
    const coingeckoId = item?.coingeckoId || item?.providerIds?.coingeckoId || item?.providerAssetId;
    return coingeckoId ? `/market/${coingeckoId}` : "";
  };

  const getAssetSymbol = (item: any): string => {
    return String(item?.symbol || item?.ticker || item?.niche || "")
      .trim()
      .toUpperCase();
  };

  const updateWatchList = async (id: string): Promise<void> => {
    if (!userData.isFullAuth) {
      toast.error(
        <div>
          <h3>{translateText("Error!")}</h3>
          <p>{translateText("You need to be fully logged in to add project to watchlist")}</p>
        </div>
      );
      return;
    }

    const isWatchListProject = watchlist?.projects?.find(
      (item: any) => item?._id === id
    );

    if (isWatchListProject) {
      const { success } = await deleteFromWatchlist(path, id);

      if (success) {
        await refetch();

        toast.success(
          <div>
            <h3>{translateText("Success!")}</h3>
            <p>{translateText("Project deleted from favorites")}</p>
          </div>
        );
      }

      return;
    }

    const { success } = await addProjectToWatchlist(path, id);

    if (success) {
      await refetch();

      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>{translateText("Project added to favorites")}</p>
        </div>
      );
    }
  };

  // Render a single asset card
  const renderAssetCard = (item: any, i: number) => {
    const isWatchListProject: boolean = watchlist?.projects?.find(
      (pr: any) => pr?._id === item._id
    );

    return (
      <Asset
        variant="main"
        key={i}
        className={getMarketPath(item) ? "clickable" : ""}
        onClick={() => {
          const path = getMarketPath(item);
          if (path) router.push(path);
        }}
      >
        <Header>
          <ProjectData>
            <UserAvatar
              avatar={imageLoader(String(item.logo))}
              size="otc"
              variant="success"
              rating={Number(item.rating || 0)}
              name={item.name}
              fallbackType="project"
            />
            <div className="info">
              <div>{item.name}</div>
              <span>{getAssetSymbol(item)}</span>
            </div>
          </ProjectData>

          <button
            onClick={(event) => {
              event.stopPropagation();
              item._id && updateWatchList(item._id);
            }}
          >
            {isWatchListProject ? (
              <StarIcon fill={isWatchListProject ? "#FFC702" : "black"} />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="14"
                viewBox="0 0 16 14"
                fill="none"
              >
                <path
                  d="M7.66339 0.810835C7.8011 0.531805 8.19899 0.531805 8.3367 0.810835L10.1194 4.42292C10.1741 4.53372 10.2798 4.61052 10.402 4.62829L14.3882 5.20751C14.6961 5.25226 14.8191 5.63067 14.5963 5.84787L11.7119 8.65948C11.6234 8.74573 11.583 8.87 11.6039 8.99178L12.2848 12.9618C12.3374 13.2685 12.0155 13.5024 11.7401 13.3576L8.17475 11.4832C8.06538 11.4257 7.93472 11.4257 7.82535 11.4832L4.26001 13.3576C3.98459 13.5024 3.66269 13.2685 3.71529 12.9618L4.39621 8.99178C4.4171 8.87 4.37672 8.74573 4.28824 8.65948L1.40382 5.84787C1.181 5.63067 1.30396 5.25226 1.61189 5.20751L5.59806 4.62829C5.72033 4.61052 5.82604 4.53372 5.88073 4.42292L7.66339 0.810835Z"
                  stroke="#070B35"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </Header>
        <PriceInfo>
          <div className="value">
            ${clarifyAmount(item.price, false, "", 6)}
          </div>
          <PercentValue
            isIcon={false}
            size="small"
            value={item?.usdQuote?.percent_change_24h || 0}
          />
        </PriceInfo>
      </Asset>
    );
  };

  if (isLoading || !data?.projects) {
    return (
      <Wrapper>
        <h2>{translateText("Trending Assets")}</h2>
        <EmptySection />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <h2>{translateText("Trending Assets")}</h2>

      {isMobile ? (
        // Mobile slider view
        <Swiper
          modules={[Pagination]}
          pagination={{ clickable: true }}
          spaceBetween={16}
          slidesPerView={1}
          breakpoints={{
            320: {
              slidesPerView: 1,
              spaceBetween: 12,
            },
            480: {
              slidesPerView: 2,
              spaceBetween: 16,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 16,
            },
          }}
        >
          {data.projects.map((item, i) => (
            <SwiperSlide key={i}>{renderAssetCard(item, i)}</SwiperSlide>
          ))}
        </Swiper>
      ) : (
        // Desktop view with regular grid layout
        <Assets>
          {data.projects.map((item, i) => renderAssetCard(item, i))}
        </Assets>
      )}
    </Wrapper>
  );
};

export default TrendingAssets;
