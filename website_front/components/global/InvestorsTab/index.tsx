import React, { FC } from "react";
import { Wrapper } from "./styles";
import Link from "next/link";
import imageLoader from "../../../helpers/imageLoader";
import RatingCircle from "../RatingCircle";
import UserAvatar from "../common/UserAvatar";
import EmptySection from "../EmptySection";
import Placeholder from "../common/Placeholder";
import { getBackerHref } from "../../../helpers/backerRoute";
import { getInvestorRating } from "../../../helpers/investorRating";

interface IProps {
  investors?: Array<any>;
  isLoading?: boolean;
}

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

const InvestorsTab: FC<IProps> = ({ investors, isLoading = false }) => {
  return (
    <Wrapper variant="main">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, index) => (
          <div className="skeleton-item" key={`investor-skeleton-${index}`}>
            <div className="skeleton-left">
              <Placeholder
                width="40px"
                height="40px"
                borderRadius="50%"
                marginBottom="0"
              />
              <div className="skeleton-info">
                <Placeholder
                  width="140px"
                  height="14px"
                  borderRadius="6px"
                  marginBottom="8px"
                />
                <Placeholder
                  width="95px"
                  height="12px"
                  borderRadius="6px"
                  marginBottom="0"
                />
              </div>
            </div>
            <Placeholder
              width="42px"
              height="42px"
              borderRadius="50%"
              marginBottom="0"
            />
          </div>
        ))
      ) : investors?.length ? (
        investors.map((item: any) => {
          const itemId = item.id || Reflect.get(item, "_id");
          const avatar = item.img || item.logo || item.image || "";
          const description = getInvestorTypeLabel(item);
          const href =
            item.url ||
            (item.entityType === "person"
              ? getBackerHref(item, "person")
              : item.entityType === "fund"
                ? getBackerHref(item, "fund")
                : "#");

          return (
            <Link key={itemId || item.slug || item.name} href={href}>
              <div className="item">
                <UserAvatar
                  variant="default"
                  size="otc"
                  avatar={imageLoader(String(avatar))}
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
      ) : (
        <EmptySection />
      )}
    </Wrapper>
  );
};

export default InvestorsTab;
