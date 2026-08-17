import React, { FC, useMemo } from "react";
import NextLink from "next/link";
import { useQuery } from "react-query";
import {
  Asset,
  Assets,
  Header,
  PriceInfo,
  ProjectData,
  Wrapper,
} from "./styles";
import UserAvatar from "../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../helpers/imageLoader";
import PercentValue from "../../../../../global/common/PercentValue";
import { IPerson } from "../../../../../../types/global_types";
import { useTranslation } from "i18n";
import fetchBackersPersonsByQuery from "../../../../../../http/backers/fetchBackersPersonsByQuery";
import getBackerRouteId, { getBackerHref } from "../../../../../../helpers/backerRoute";
import EmptySection from "../../../../../global/EmptySection";

const toFiniteNumber = (value: any): number => {
  const parsed = Number(
    typeof value === "string"
      ? value.replace(/[$,%\sx]/g, "").replace(/,/g, "")
      : value
  );

  return Number.isFinite(parsed) ? parsed : 0;
};

const getSpecialization = (item: any): string => {
  if (item?.specialization) return item.specialization;
  if (Array.isArray(item?.specializations) && item.specializations.length) {
    return item.specializations.join(", ");
  }
  if (Array.isArray(item?.sectors) && item.sectors.length) {
    return item.sectors.slice(0, 3).join(", ");
  }

  return item?.niche || item?.type || "-";
};

const TopPersons: FC<{ person?: IPerson }> = ({ person }) => {
  const { translateText } = useTranslation();
  const currentPersonRouteId = getBackerRouteId(person);
  const { data, isLoading } = useQuery(
    ["names-you-should-know", currentPersonRouteId],
    () =>
      fetchBackersPersonsByQuery(
        "?limit=8&sortBy=supportedProjectsCount&sortOrder=desc"
      ),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );
  const persons = useMemo(() => {
    const currentId = currentPersonRouteId;

    return (data?.persons || [])
      .filter((item: any) => getBackerRouteId(item) !== currentId)
      .slice(0, 6);
  }, [currentPersonRouteId, data?.persons]);

  return (
    <Wrapper>
      <h2>{translateText("Names You Should Know")}</h2>
      <Assets>
        {!isLoading && !persons.length ? (
          <EmptySection className="profile-list-empty" />
        ) : (
          persons.map((item: any, i: number) => {
            const athRoi = toFiniteNumber(item.athRoi ?? item.roi);
            const content = (
              <Asset variant="main">
                <Header>
                  <ProjectData>
                    <UserAvatar
                      avatar={imageLoader(String(item.logo || item.avatar || ""))}
                      size="otc"
                      variant="success"
                      rating={Number(item.rating)}
                      name={item.name}
                    />
                    <div className="info">
                      <div>{item.name}</div>
                      <span>{item.niche || item.type || "-"}</span>
                    </div>
                  </ProjectData>
                  <button>
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
                  </button>
                </Header>
                <PriceInfo>
                  <div className="info-wrapper">
                    <span>{translateText("Specialization")}</span>
                    <div className="value">{getSpecialization(item)}</div>
                  </div>
                  <div className="info-wrapper">
                    <span>{translateText("ATH ROI")}</span>
                    {athRoi ? (
                      <PercentValue isIcon={false} size="small" value={athRoi} />
                    ) : (
                      <div className="value">-</div>
                    )}
                  </div>
                </PriceInfo>
              </Asset>
            );
            const href = getBackerHref(item, "person");

            return href !== "#" ? (
              <NextLink
                className="profile-list-card"
                href={href}
                key={getBackerRouteId(item) || i}
              >
                {content}
              </NextLink>
            ) : (
              <div
                className="profile-list-card"
                key={getBackerRouteId(item) || i}
              >
                {content}
              </div>
            );
          })
        )}
      </Assets>
    </Wrapper>
  );
};

export default TopPersons;
