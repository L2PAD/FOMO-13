import React, {
  FC,
  memo,
  useState,
} from "react";
import { useRouter } from "next/router";
import {
  getProjectImage,
  getUserLogo,
  setProjectImageFallback,
  setUserLogoFallback,
} from "../../../../helpers/imageFallbacks";
import { IDeal } from "../../../../types/global_types";
import SearchEmpty from '../../../../assets/animations/Not Found.json'
import Searching from '../../../../assets/animations/loading_gray.json'
import { ISearchMetaTab, ISearchResults } from "../../../../http/search/fetchSearch";
import {
  SearchResultsItems,
  SearchResultsList,
  SearchResultsTitle,
  SearchResultsWrapper,
  SearchResultsItem,
  SearchResultsItemInfo,
  SearchResultsItemTitle,
  SearchResultsItemDescription,
  NoResultsMessage,
  SearchResultsBlock,
  Tabs,
  TabButton,
  SearchResultsProjectDetails,
  SeeAllButton,
  BlockLine,
} from "./styles";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import PercentValue from "../../common/PercentValue";
import { DealStatusWrapper } from "../../../layouts/projects/OTC/DealItem/styles";
import upperCaseFirstLetter from "../../../../helpers/upperCaseFirstLetter";
import dynamic from "next/dynamic";
import getBackerRouteId from "../../../../helpers/backerRoute";

const Lottie = dynamic(
  () => import("../../../global/LottieClient/index"),
  { ssr: false }
);

interface IProps {
  className?: string;
  data: ISearchResults | null | undefined;
  isVisible: boolean;
  isLoading: boolean;
  onNavigate?: () => void;
}

type SearchResultType =
  | "projects"
  | "funds"
  | "persons"
  | "news"
  | "deals";

const normalizeRouteId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "object") {
    return normalizeRouteId(value.$oid || value._id || value.id);
  }

  return String(value).trim();
};

const getSearchResultRoute = (item: any, type: SearchResultType): string => {
  if (type === "projects") {
    const routeId = normalizeRouteId(
      item?.coingeckoId ||
        item?.projectData?.coingeckoId ||
        item?._id ||
        item?.id ||
        item?.slug
    );

    return routeId ? `/market/${encodeURIComponent(routeId)}` : "";
  }

  if (type === "funds" || type === "persons") {
    const routeId = getBackerRouteId(item);
    return routeId
      ? `/crypto/${type}/${encodeURIComponent(routeId)}`
      : "";
  }

  if (type === "news") {
    const routeId = normalizeRouteId(item?._id || item?.id || item?.slug);
    return routeId ? `/utility/news/${encodeURIComponent(routeId)}` : "";
  }

  return "/utility/otc";
};


const MemoizedSearchResultsItem = memo(
  ({
    item,
    type,
  }: {
    item: any;
    type: SearchResultType;
  }) => {
    const route = getSearchResultRoute(item, type);
    if (!route) return null;

    if (type === "projects") {
      return (
        <SearchResultsItem href={route}>
          <img
            src={getProjectImage(
              item.logo || item.metadataLogo,
              item.name || item.symbol
            )}
            alt={item.name}
            loading="lazy"
            onError={setProjectImageFallback}
          />

          <SearchResultsItemInfo>
            <SearchResultsItemTitle>
              <span>{item?.symbol || item.niche}</span>
              <div>{item.name}</div>
            </SearchResultsItemTitle>

            <SearchResultsProjectDetails>
              <div className="value">
                ${item.price ? clarifyAmount(item.price) : "N/A"}
              </div>

              <PercentValue
                size="small"
                isIcon={false}
                value={item?.usdQuote?.percent_change_24h || 0}
                rightLabel="%"
              />
            </SearchResultsProjectDetails>
          </SearchResultsItemInfo>
        </SearchResultsItem>
      );
    }


    if (type === "funds") {
      return (
        <SearchResultsItem href={route}>
          <img
            src={getProjectImage(
              item.logo || item.metadataLogo,
              item.name || item.symbol
            )}
            alt={item.name}
            loading="lazy"
            onError={setProjectImageFallback}
          />

          <SearchResultsItemInfo>
            <SearchResultsItemTitle>
              <span>{item.niche}</span>
              <div>{item.name}</div>
            </SearchResultsItemTitle>
          </SearchResultsItemInfo>
        </SearchResultsItem>
      );
    }


    if (type === "persons") {
      return (
        <SearchResultsItem href={route}>
          <img
            src={getUserLogo(item.logo || item.metadataLogo)}
            alt={item.name}
            loading="lazy"
            onError={setUserLogoFallback}
          />

          <SearchResultsItemInfo>
            <SearchResultsItemTitle>
              <span>{item.niche}</span>
              <div>{item.name}</div>
            </SearchResultsItemTitle>
          </SearchResultsItemInfo>
        </SearchResultsItem>
      );
    }


    if (type === "deals") {
      const deal = item as IDeal;
      return (
        <SearchResultsItem href={route}>
          <SearchResultsItemInfo>
            <SearchResultsItemTitle>
              <span>{deal.name}</span>
              <DealStatusWrapper status={deal.status}>
                <span>{upperCaseFirstLetter(deal.status)}</span>
              </DealStatusWrapper>
            </SearchResultsItemTitle>
          </SearchResultsItemInfo>
        </SearchResultsItem>
      );
    }

    return (
      <SearchResultsItem href={route}>
        <img
          src={getProjectImage(
            item.logo || item.metadataLogo,
            item.name || item.symbol
          )}
          alt={item.name}
          loading="lazy"
          onError={setProjectImageFallback}
        />
        <SearchResultsItemInfo>
          <SearchResultsItemTitle>{item.name}</SearchResultsItemTitle>
          <SearchResultsItemDescription>
            {item.banner}
          </SearchResultsItemDescription>
        </SearchResultsItemInfo>
      </SearchResultsItem>
    );
  }
);

const SearchResults: FC<IProps> = ({
  className,
  data,
  isVisible,
  isLoading,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const router = useRouter();
  const projects = data?.projects?.items || [];
  const funds = data?.funds?.items || [];
  const persons = data?.persons?.items || [];
  const deals = data?.deals?.items || [];

  const handleRoute = (key: string) => {
    switch (key) {
      case "projects":
        router.push("/crypto/projects");
        break;

      case "funds":
        router.push("/crypto/backers?tab=funds");
        break;

      case "persons":
        router.push("/crypto/backers?tab=persons");
        break;

      case "deals":
        router.push("/utility");
        break;

      case "all":
      default:
        router.push("/");
        break;
    }

    onNavigate?.();
  };

  const isTabVisible = (tab: string) => {
    return activeTab === "all" || activeTab === tab;
  };

  const metaTabs: ISearchMetaTab[] =
    data?.meta?.tabs?.filter((item) => item.total > 0) || [];

  const isEmpty =
    !isLoading &&
    projects.length === 0 &&
    funds.length === 0 &&
    persons.length === 0 &&
    deals.length === 0;

  return (
    <SearchResultsWrapper className={className} isVisible={isVisible} isEmpty={projects.length === 0}>
      {isLoading ? <NoResultsMessage>
        <Lottie
          style={{ width: 30, height: 30 }}
          className="lottie-no-results"
          animationData={Searching}
          loop={true}
        />
        Searching...
      </NoResultsMessage> : (
        <>
          {
            !isEmpty ? (
              <SearchResultsBlock>
                <Tabs>
                  {metaTabs.map((tab) => (
                    <TabButton
                      onClick={() => setActiveTab(tab.key)}
                      className={activeTab === tab.key ? "active" : ""}
                      key={tab.key}
                    >
                      {tab.name}
                    </TabButton>
                  ))}
                </Tabs>

                {isTabVisible("projects") && projects.length ? (
                  <SearchResultsItems>
                    <SearchResultsTitle>
                      <span>Assets</span>
                      <span>Price/24h %</span>
                    </SearchResultsTitle>

                    <SearchResultsList>
                      {projects.map((item) => (
                        <MemoizedSearchResultsItem
                          key={item._id}
                          item={item}
                          type="projects"
                        />
                      ))}
                      <div />
                    </SearchResultsList>

                    <SeeAllButton onClick={() => handleRoute("projects")}>
                      See All Assets ({data?.projects.total || 0})
                    </SeeAllButton>

                    <BlockLine />
                  </SearchResultsItems>
                ) : null}

                {isTabVisible("funds") && funds.length ? (
                  <SearchResultsItems>
                    <SearchResultsTitle>
                      <span>Funds</span>
                    </SearchResultsTitle>

                    <SearchResultsList>
                      {funds.map((item) => (
                        <MemoizedSearchResultsItem
                          key={item._id}
                          item={item}
                          type="funds"
                        />
                      ))}
                      <div />
                    </SearchResultsList>

                    <SeeAllButton onClick={() => handleRoute("funds")}>
                      See All Funds ({data?.funds.total || 0})
                    </SeeAllButton>

                    <BlockLine />
                  </SearchResultsItems>
                ) : null}

                {isTabVisible("persons") && persons.length ? (
                  <SearchResultsItems>
                    <SearchResultsTitle>
                      <span>Persons</span>
                    </SearchResultsTitle>

                    <SearchResultsList>
                      {persons.map((item) => (
                        <MemoizedSearchResultsItem
                          key={item._id}
                          item={item}
                          type="persons"
                        />
                      ))}
                      <div />
                    </SearchResultsList>

                    <SeeAllButton onClick={() => handleRoute("persons")}>
                      See All Persons ({data?.persons.total || 0})
                    </SeeAllButton>

                    <BlockLine />
                  </SearchResultsItems>
                ) : null}

                {isTabVisible("deals") && deals.length ? (
                  <SearchResultsItems>
                    <SearchResultsTitle>
                      <span>Deals</span>
                    </SearchResultsTitle>

                    <SearchResultsList>
                      {deals.map((item) => (
                        <MemoizedSearchResultsItem
                          key={item._id}
                          item={item}
                          type="deals"
                        />
                      ))}
                      <div />
                    </SearchResultsList>

                    <SeeAllButton onClick={() => handleRoute("deals")}>
                      See All Deals ({data?.deals.total || 0})
                    </SeeAllButton>

                    <BlockLine />
                  </SearchResultsItems>
                ) : null}
              </SearchResultsBlock>
            ) : (
              <NoResultsMessage>
                <Lottie className="lottie-no-results" animationData={SearchEmpty} loop />
                No Search Results
              </NoResultsMessage>
            )
          }
        </>
      )}
    </SearchResultsWrapper>
  );
};

export default SearchResults;
