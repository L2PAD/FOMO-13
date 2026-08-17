import React, { FC, useState } from "react";
import UserAvatar from "../../../global/common/UserAvatar";
import { UsersScoreUserButton } from "../Persons/SocialPerson/styles";
import LeftArrow from "../../../../assets/icons/left-arrow.svg";
import {
  CardContentItem,
  CardContentItemUserWrapper,
  CardContentWrapper,
  CardTitle,
  CardWrapper,
  PeriodButton,
  PeriodButtonsWrapper,
} from "./styles";
import { Value } from "../../../lib/TopCard/styles";
import { IProject } from "../../../../types/global_types";
import imageLoader from "../../../../helpers/imageLoader";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import PercentValue from "../../../global/common/PercentValue";
import Image from "next/image";
import Placeholder from "../../../global/common/Placeholder";
import { useRouter } from "next/router";
import { simplifyAmount } from "../../../../helpers/simplifyAmount";

export type ColumnType = "recently" | "gainers" | "trending" | "accumulation";

interface Props {
  title?: string;
  onClick: () => void;
  data: Array<IProject>;
  type: ColumnType;
}

const periods = ["24h", "7D"];

const getProjectSymbol = (project: IProject): string =>
  String(project?.symbol || project?.niche || "")
    .trim()
    .toUpperCase();

const getMarketProjectPath = (project: IProject): string | null => {
  const id = String(
    project?.coingeckoId ||
      (project as any)?.providerIds?.coingeckoId ||
      (project as any)?.providerAssetId ||
      ""
  ).trim();

  return id ? `/market/${encodeURIComponent(id)}` : null;
};

const RecentlyAdded: FC<Props> = ({ title, data, onClick, type }) => {
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState(periods[0]);

  const openProject = (project: IProject) => {
    const path = getMarketProjectPath(project);
    if (path) router.push(path);
  };

  const getCurrentValue = (project: IProject): any => {
    const values: any = {
      recently: (
        <Value variant="default">
          ${simplifyAmount(project?.price || 0, 2)}
          <PercentValue
            size="small"
            value={Number((project.priceChange || 0).toFixed(2))}
          />
        </Value>
      ),
      gainers: (
        <Value variant="default">
          ${simplifyAmount(project?.price || 0, 2)}
          <PercentValue size="small" value={Number(project.priceChange || 0)} />
        </Value>
      ),
      trending: (
        <Value variant="default">
          ${simplifyAmount(project?.price || 0, 2)}
          <PercentValue
            size="small"
            value={Number((project.priceChange || 0).toFixed(2))}
          />
        </Value>
      ),
      accumulation: (
        <Value variant="default">
          ${clarifyAmount(project.volume24h || 0)}
        </Value>
      ),
    };

    return values[type];
  };

  return data?.length ? (
    <CardWrapper>
      {title && <CardTitle>
        <p>{title}</p>
        <PeriodButtonsWrapper>
          <button onClick={() => router.push(`/crypto/${type}`)}>
            <Image src={LeftArrow} alt="all" />
          </button>
        </PeriodButtonsWrapper>
      </CardTitle>}
      <CardContentWrapper>
        {data.map((item: IProject) => {
          const projectPath = getMarketProjectPath(item);

          return (
            <CardContentItem
              key={item._id || item.coingeckoId || item.name}
              $clickable={Boolean(projectPath)}
              role={projectPath ? "link" : undefined}
              tabIndex={projectPath ? 0 : undefined}
              onClick={() => openProject(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openProject(item);
                }
              }}
            >
              <CardContentItemUserWrapper>
                <div>
                  <UserAvatar
                    size="otc"
                    avatar={imageLoader(String(item.logo))}
                    name={item.name}
                    variant="default"
                  />
                  <div>
                    <p>{item.name}</p>
                    <span>{getProjectSymbol(item)}</span>
                  </div>
                </div>
              </CardContentItemUserWrapper>
              {getCurrentValue(item)}
            </CardContentItem>
          );
        })}
      </CardContentWrapper>
    </CardWrapper>
  ) : (
    <Placeholder width="100%" height="100%" />
  );
};

export default RecentlyAdded;
