import React, { FC } from "react";
import { useRouter } from "next/router";
import { ActivityItem, Body, SliderContainer, Wrapper } from "./styles";
import EntityInfo from "../common/EntityInfo";
import UsersRow from "../UsersRow";
import EmptyList from "../EmptyList";
import { clarifyAmount } from "../../../helpers/clarifyAmount";
import { sanitizedHtml } from "../../../helpers/sanitizeHtml";

interface NewActivitiesProps {
  data: any;
}

const EMPTY_VALUE = "-";

const getActivitySymbol = (item: any): string => {
  const canonicalSymbol = String(item.canonicalProject?.symbol || "").trim();
  const adminSymbol = String(item.symbol || "").trim();

  return canonicalSymbol || adminSymbol || EMPTY_VALUE;
};

const compactAmount = (value: number) => {
  const absValue = Math.abs(value);
  const format = (amount: number) =>
    Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace(/\.0$/, "");

  if (absValue >= 1_000_000_000) return `${format(value / 1_000_000_000)}B`;
  if (absValue >= 1_000_000) return `${format(value / 1_000_000)}M`;
  if (absValue >= 1_000) return `${format(value / 1_000)}K`;

  return String(clarifyAmount(value));
};

const formatFundsRaised = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return EMPTY_VALUE;

    const compactMatch = trimmed.match(/^\$?\s*([\d,.]+(?:\.\d+)?)\s*([KMBT])(\+)?$/i);
    if (compactMatch) {
      return `$${compactMatch[1].replace(/,/g, "")}${compactMatch[2].toUpperCase()}${compactMatch[3] || ""}`;
    }

    const parsed = Number(trimmed.replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) return EMPTY_VALUE;

    return `$${compactAmount(parsed)}`;
  }

  if (!Number.isFinite(value) || value <= 0) return EMPTY_VALUE;

  return `$${compactAmount(value)}`;
};

const NewActivities: FC<NewActivitiesProps> = ({ data }) => {
  const router = useRouter();
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data)
        ? data.data
        : data?.data?.items || [];

  return  (
    <SliderContainer>
      <Wrapper>
        <Body>
          {items.length ? (
            items.slice(0, 5).map((item: any) => {
              const activityId = item._id || item.id;
              const name = item.canonicalProject?.name || item.projectName || item.coinName || item.name;
              const symbol = getActivitySymbol(item);
              const logo =
                item.canonicalProject?.logo || item.projectLogo || item.logo || item.relatedAssets?.[0]?.image;
              const description = typeof item.description === "string"
                ? item.description
                : item.description?.about || "";
              const allocationTag = item.activityType;

              return (
                <ActivityItem
                  key={item.slug || activityId}
                  className={activityId ? "clickable" : undefined}
                  onClick={
                    activityId
                      ? () => router.push(`/crypto/earlyland/${activityId}`)
                      : undefined
                  }
                  onKeyDown={
                    activityId
                      ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/crypto/earlyland/${activityId}`);
                        }
                      }
                      : undefined
                  }
                  role={activityId ? "link" : undefined}
                  tabIndex={activityId ? 0 : undefined}
                >
                  <EntityInfo
                    img={logo}
                    name={name}
                    niche={symbol}
                    variant="default"
                    fallbackType="project"
                  />
                  <div
                    className="text"
                    dangerouslySetInnerHTML={sanitizedHtml(description)}
                  />
                  <div className="users">
                    <div className="value">
                      {formatFundsRaised(item.fundsRaised ?? item.totalRaised)}
                    </div>

                    <UsersRow
                      users={Array.isArray(item.investors) ? item.investors : []}
                    />
                  </div>
                  <div className="tag">{allocationTag}</div>
                </ActivityItem>
              );
            })
          ) : (
            <>
              <br />
              <EmptyList imgWidth={150} lineHeight={170} fontSize={16} gap={10}/>
            </>
          )}
        </Body>
      </Wrapper>
    </SliderContainer>
  );
};

export default NewActivities;
