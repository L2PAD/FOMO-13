import React, { useState, useEffect, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import styled from "styled-components";
import imageLoader from "../../../helpers/imageLoader";
import BaseCard from "../common/BaseCard";
import SearchCountry from "../SearchCountry";
import UsersRow from "../UsersRow";
import { clarifyAmount } from "../../../helpers/clarifyAmount";
import UserAvatar from "../common/UserAvatar";
import { getProjectImage } from "../../../helpers/imageFallbacks";
import {
  fetchFomoV2Backers,
  isFomoV2BackersEnabled,
} from "../../../http/backers/backersApi";
import type {
  BackersGlobalInvestmentMap,
  BackersGlobalInvestmentMapCountry,
  BackersGlobalInvestmentMapEntity,
} from "../../../http/funds/fetchFundsAnalytics";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  height: fit-content;
`;

export const Header = styled.div`
  width: 360px;
  max-width: 100%;
  margin-bottom: 12px;

  path {
    fill: #738094 !important;
  }

  & > div,
  & > div > div {
    width: 100%;
  }

  input {
    background: white;
    width: 100%;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const CountryInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;

  & .row {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--main-black);
    flex-wrap: wrap;

    div {
      font-size: 16px;
      font-weight: var(--font-weight-semibold);
    }

    span {
      font-size: 16px;
    }
  }
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const DetailSection = styled.div`
  min-width: 0;
  padding: 12px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid rgba(83, 98, 124, 0.08);

  h4 {
    margin: 0 0 10px;
    font-size: 15px;
    font-weight: var(--font-weight-semibold);
    color: #070b35;
  }
`;

const EntityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EntityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  .entity-text {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .entity-name {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: #070b35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entity-meta {
    font-size: 12px;
    color: #738094;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const CategoryList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const CategoryPill = styled.div`
  max-width: 100%;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(4, 165, 132, 0.1);
  color: #04a584;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  span {
    color: #738094;
    font-weight: var(--font-weight-medium);
  }
`;

const EmptyText = styled.div`
  color: #738094;
  font-size: 14px;
`;

const MapStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
`;

const MapStat = styled.div`
  padding: 7px 9px;
  border-radius: 8px;
  background: rgba(7, 11, 53, 0.04);
  color: #070b35;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);

  span {
    color: #738094;
    font-weight: var(--font-weight-medium);
  }
`;

export interface ICountry {
  geometry: any;
  id: string;
  properties: { name: string };
  rsmKey: string;
  svgPath: string;
  type: string;
  img?: string;
  region?: string;
  subregion?: string;
}

// Тип для статистики фонда
interface IFundStats {
  totalInvestAmount: number;
  fundsCount: number;
  portfolioCoins: IMapEntity[];
  topCategory: string;
  topCategoryCount?: number;
  keyProjects: IMapEntity[];
  topProjects?: IMapEntity[];
  topCategories?: {
    label: string;
    value: number;
    amount?: number;
    projectsCount?: number;
  }[];
  topInvestors?: IMapEntity[];
}

type IMapEntity = BackersGlobalInvestmentMapEntity;

type ICountryMetric = BackersGlobalInvestmentMapCountry;

interface IGlobalMapProps {
  countryMetrics?: ICountryMetric[];
  investmentMap?: BackersGlobalInvestmentMap;
  isLoading?: boolean;
  queryString?: string;
}

const normalizeCountryKey = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getCountryLabel = (country: ICountry) => {
  const name = country.properties?.name || country.region || "";
  return name ? `${name} (${country.id})` : country.id;
};

const getEntityLogo = (item?: IMapEntity) =>
  getProjectImage(item?.logo || item?.image, item?.name || item?.symbol);

const formatAmount = (value?: number) => {
  const amount = Number(value || 0);
  return amount > 0 ? `$${clarifyAmount(amount)}` : "";
};

const metricToCountryOption = (item: ICountryMetric): ICountry => ({
  geometry: null,
  id: item.countryCode || item.country,
  properties: { name: item.country },
  rsmKey: item.countryCode || item.country,
  svgPath: "",
  type: "Feature",
});

const GlobalMap = ({
  countryMetrics = [],
  investmentMap,
  isLoading,
  queryString = "",
}: IGlobalMapProps) => {
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);
  const [fallbackInvestmentMap, setFallbackInvestmentMap] =
    useState<BackersGlobalInvestmentMap | null>(null);
  const [isMapLoading, setIsMapLoading] = useState<boolean>(false);
  const activeInvestmentMap = investmentMap || fallbackInvestmentMap;
  const mapCountries = activeInvestmentMap?.countries?.length
    ? activeInvestmentMap.countries
    : countryMetrics;
  const mapLoading = Boolean(isLoading || isMapLoading);
  const maxMetricValue = Math.max(
    ...mapCountries.map((item) =>
      Number(item.value || item.totalInvestAmount || 0)
    ),
    0
  );
  const metricByCountryKey = useMemo(() => {
    const map = new Map<string, ICountryMetric>();

    mapCountries.forEach((item) => {
      [
        item.countryCode,
        item.country,
        ...(Array.isArray(item.sourceCountries) ? item.sourceCountries : []),
      ].forEach((value) => {
        const key = normalizeCountryKey(value);
        if (key && !map.has(key)) map.set(key, item);
      });
    });

    return map;
  }, [mapCountries]);
  const countrySearchOptions = useMemo(
    () => mapCountries.map(metricToCountryOption),
    [mapCountries]
  );
  const getMetric = (geo: ICountry) => {
    const geoId = normalizeCountryKey(geo.id);
    const geoName = normalizeCountryKey(geo.properties?.name);

    return metricByCountryKey.get(geoId) || metricByCountryKey.get(geoName);
  };

  const handleCountryClick = (geo: ICountry) => {
    setSelectedCountry(geo);
  };

  useEffect(() => {
    if (investmentMap || countryMetrics.length || !isFomoV2BackersEnabled()) {
      return;
    }

    let isMounted = true;
    const loadInvestmentMap = async () => {
      setIsMapLoading(true);
      try {
        const { data, res } = await fetchFomoV2Backers(
          "funds/global-investment-map",
          queryString
        );
        if (isMounted && res.ok && data?.ok !== false) {
          setFallbackInvestmentMap(data);
        }
      } finally {
        if (isMounted) setIsMapLoading(false);
      }
    };

    loadInvestmentMap();

    return () => {
      isMounted = false;
    };
  }, [countryMetrics.length, investmentMap, queryString]);

  const selectedMetric = selectedCountry
    ? getMetric(selectedCountry)
    : undefined;
  const fundStats = selectedMetric as IFundStats | undefined;
  const topProjects =
    fundStats?.topProjects ||
    fundStats?.keyProjects ||
    fundStats?.portfolioCoins ||
    [];
  const topCategories = fundStats?.topCategories || [];
  const topInvestors = fundStats?.topInvestors || [];
  const dataQuality = activeInvestmentMap?.dataQuality;

  return (
    <Wrapper variant="main">
      <Header>
        <SearchCountry
          countries={countrySearchOptions}
          selectedCountry={selectedCountry}
          onChange={(value: ICountry) => setSelectedCountry(value)}
        />
      </Header>

      {dataQuality ? (
        <MapStats>
          <MapStat>
            Capital <span>{formatAmount(dataQuality.totalInvestAmount)}</span>
          </MapStat>
          <MapStat>
            Located Funds{" "}
            <span>
              {dataQuality.fundsWithKnownCountry || 0}/
              {dataQuality.totalFunds || 0}
              {dataQuality.countryCoveragePercent !== undefined
                ? ` (${dataQuality.countryCoveragePercent}%)`
                : ""}
            </span>
          </MapStat>
          <MapStat>
            Unknown <span>{dataQuality.fundsWithoutCountry || 0}</span>
          </MapStat>
        </MapStats>
      ) : null}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 120, center: [0, 40] }}
      >
        <Geographies geography={imageLoader("/features.json")}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const metric = getMetric(geo);
              const intensity = maxMetricValue
                ? Math.min(
                    Number(metric?.value || metric?.totalInvestAmount || 0) /
                      maxMetricValue,
                    1
                  )
                : 0;
              const defaultFill = metric
                ? `rgba(4, 165, 132, ${0.25 + intensity * 0.55})`
                : "#FFFFFF";
              const isSelected =
                selectedCountry?.id === geo.id ||
                selectedCountry?.properties?.name === geo.properties.name;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => handleCountryClick(geo)}
                  style={{
                    default: {
                      fill: isSelected ? "#FF5858" : defaultFill,
                      stroke: "#868686",
                      strokeWidth: 0.25,
                    },
                    hover: {
                      fill: "#FF8585",
                      stroke: "#FF8585",
                      strokeWidth: 0.25,
                    },
                    pressed: {
                      fill: "#FF5858",
                      stroke: "#FF5858",
                      strokeWidth: 0.25,
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {selectedCountry ? (
        <CountryInfo>
          <div className="row">
            <div>Country:</div>
            <span>
              {selectedMetric
                ? `${selectedMetric.country} (${selectedMetric.countryCode || selectedCountry.id})`
                : getCountryLabel(selectedCountry)}
            </span>
          </div>

          {mapLoading ? (
            <EmptyText>Loading country details...</EmptyText>
          ) : (
            <DetailsGrid>
              <DetailSection>
                <h4>Top Projects</h4>
                {topProjects.length ? (
                  <>
                    <UsersRow users={topProjects.slice(0, 10)} />
                    <EntityList>
                      {topProjects.slice(0, 5).map((project, index) => (
                        <EntityItem
                          key={`${project.slug || project.name}-${index}`}
                        >
                          <UserAvatar
                            size="xSmall"
                            variant="default"
                            avatar={getEntityLogo(project)}
                            name={project.name}
                          />
                          <div className="entity-text">
                            <span className="entity-name">{project.name}</span>
                            <span className="entity-meta">
                              {[
                                project.category,
                                formatAmount(project.amount),
                                project.backersCount
                                  ? `${project.backersCount} backers`
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" / ") ||
                                project.symbol ||
                                "-"}
                            </span>
                          </div>
                        </EntityItem>
                      ))}
                    </EntityList>
                  </>
                ) : (
                  <EmptyText>-</EmptyText>
                )}
              </DetailSection>

              <DetailSection>
                <h4>Top Categories</h4>
                {topCategories.length ? (
                  <CategoryList>
                    {topCategories.map((category) => (
                      <CategoryPill key={category.label}>
                        {category.label}{" "}
                        <span>
                          {category.amount
                            ? formatAmount(category.amount)
                            : category.value}
                        </span>
                      </CategoryPill>
                    ))}
                  </CategoryList>
                ) : (
                  <EmptyText>{fundStats?.topCategory || "-"}</EmptyText>
                )}
              </DetailSection>

              <DetailSection>
                <h4>Top Investors</h4>
                {topInvestors.length ? (
                  <EntityList>
                    {topInvestors.slice(0, 5).map((investor, index) => (
                      <EntityItem
                        key={`${investor.slug || investor.name}-${index}`}
                      >
                        <UserAvatar
                          size="xSmall"
                          variant="default"
                          avatar={getEntityLogo(investor)}
                          name={investor.name}
                        />
                        <div className="entity-text">
                          <span className="entity-name">{investor.name}</span>
                          <span className="entity-meta">
                            {[
                              investor.rating
                                ? `Rating ${investor.rating}`
                                : "",
                              investor.projectsCount
                                ? `${investor.projectsCount} projects`
                                : "",
                              formatAmount(investor.investAmount),
                            ]
                              .filter(Boolean)
                              .join(" / ") || "-"}
                          </span>
                        </div>
                      </EntityItem>
                    ))}
                  </EntityList>
                ) : (
                  <EmptyText>-</EmptyText>
                )}
              </DetailSection>
            </DetailsGrid>
          )}
        </CountryInfo>
      ) : null}
    </Wrapper>
  );
};

export default GlobalMap;
