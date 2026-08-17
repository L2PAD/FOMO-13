import React, { FC, useState } from "react";
import { Wrapper } from "./styles";
import Link from "next/link";
import imageLoader from "../../../helpers/imageLoader";
import RatingCircle from "../RatingCircle";
import UserAvatar from "../common/UserAvatar";
import EmptySection from "../EmptySection";
import { IProjectWithRefetch } from "../../../contexts/projectDataContext";
import { useQuery } from "react-query";
import TopInvestorsModal from "../../layouts/projects/Crypto/Modals/top_investors_modal";
import RightIcon from "../../../assets/icons/left-arrow.svg";
import { RightColumnTitle } from "../../layouts/projects/Crypto/Project/crypto-styles";
import Image from "next/image";
import fetchProjectTopInvestors from "../../../http/investors/fetchProjectTopInvestors";
import { getBackerHref } from "../../../helpers/backerRoute";
import { getInvestorRating } from "../../../helpers/investorRating";

interface InvestorSlugData {
  investorSlug: string;
  [key: string]: any;
}

interface FundingRound {
  investors?: InvestorSlugData[];
  [key: string]: any;
}

export function extractInvestorSlugs(rounds?: FundingRound[]): string {
  if (!rounds) return "";

  return rounds
    .flatMap((round) => round.investors || [])
    .map((investor) => investor.investorSlug)
    .filter(Boolean)
    .join(",");
}

interface IProps {
  project: IProjectWithRefetch;
}

const PREVIEW_LIMIT = 5;

const isLikelyBioText = (value?: string): boolean => {
  const text = String(value || "").trim();
  return text.length > 48 || /[.!?]/.test(text);
};

const getInvestorTypeLabel = (item: any): string => {
  const banner = String(item?.banner || "").trim();

  return (
    item?.niche ||
    item?.investorType ||
    item?.typeLabel ||
    item?.category ||
    (!isLikelyBioText(banner) ? banner : "") ||
    item?.tier ||
    item?.stage ||
    item?.type ||
    item?.entityType ||
    ""
  );
};

const MarketInvestorsTab: FC<IProps> = ({ project }) => {
  const [isInvestorsModal, setIsInvestorsModal] = useState(false);
  const projectAny = project as any;
  const v2ProjectKey = String(
    projectAny?.coingeckoId || projectAny?.canonicalProjectId || ""
  ).trim();
  const v2Lookup = projectAny?.coingeckoId
    ? "coingeckoId"
    : "canonicalProjectId";
  const legacyProjectKey = String(
    Reflect.get(project || {}, "_id") ||
      project?.slug ||
      project?.sourceId ||
      ""
  ).trim();
  const isV2MarketProject =
    project?.projectType === "market" && Boolean(v2ProjectKey);
  const { data, isLoading } = useQuery(
    [
      "project-top-investors",
      isV2MarketProject ? "fomo-v2" : "legacy",
      isV2MarketProject ? v2ProjectKey : legacyProjectKey,
      PREVIEW_LIMIT,
    ],
    () =>
      fetchProjectTopInvestors(
        isV2MarketProject ? v2ProjectKey : legacyProjectKey,
        PREVIEW_LIMIT,
        isV2MarketProject
          ? { source: "fomo-v2", lookup: v2Lookup }
          : { source: "legacy" }
      ),
    {
      enabled: Boolean(isV2MarketProject ? v2ProjectKey : legacyProjectKey),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );
  const { data: modalData } = useQuery(
    [
      "project-top-investors",
      isV2MarketProject ? "fomo-v2" : "legacy",
      isV2MarketProject ? v2ProjectKey : legacyProjectKey,
      "all",
    ],
    () =>
      fetchProjectTopInvestors(
        isV2MarketProject ? v2ProjectKey : legacyProjectKey,
        "all",
        isV2MarketProject
          ? { source: "fomo-v2", lookup: v2Lookup }
          : { source: "legacy" }
      ),
    {
      enabled:
        Boolean(isV2MarketProject ? v2ProjectKey : legacyProjectKey) &&
        isInvestorsModal,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );
  const investors = data?.isSuccess ? data.investors : [];
  const modalInvestors = modalData?.isSuccess ? modalData.investors : investors;

  return (
    <>
      <RightColumnTitle style={{ marginTop: "20px" }}>
        <h2>Top Investors</h2>
        <button onClick={() => setIsInvestorsModal(true)}>
          <Image src={RightIcon} alt="investors" />
        </button>
      </RightColumnTitle>
      <Wrapper variant="main">
        {investors?.length ? (
          investors.map((item: any) => {
            const itemId = item.id || Reflect.get(item, "_id");
            const href =
              item.url ||
              (item.entityType === "person"
                ? getBackerHref(item, "person")
                : getBackerHref(item, "fund"));
            const description = getInvestorTypeLabel(item);

            return (
              <Link key={itemId || item.slug} href={href}>
                <div className="item">
                  <UserAvatar
                    variant="default"
                    size="otc"
                    avatar={imageLoader(String(item.logo))}
                    name={item.name}
                  />
                  <div className="info">
                    <div className="name">
                      <span>{item.name}</span>
                      {item.isLead ? <div className="lead">Lead</div> : null}
                    </div>
                    <div className="description">{description}</div>
                  </div>
                </div>
                <RatingCircle
                  variant="success"
                  rating={getInvestorRating(item)}
                />
              </Link>
            );
          })
        ) : isLoading ? (
          <EmptySection />
        ) : (
          <EmptySection />
        )}
      </Wrapper>
      <TopInvestorsModal
        isVisible={isInvestorsModal}
        onClose={() => setIsInvestorsModal(false)}
        investors={modalInvestors}
      />
    </>
  );
};

export default MarketInvestorsTab;
