import React, { FC } from "react";
import { useRouter } from "next/router";
import { RowWrapper } from "./styles";
import FavButton from "../FavButton";
import { resolveCryptoEntityProjectRoute } from "../../../../helpers/cryptoProjectRoute";
import getBackerRouteId from "../../../../helpers/backerRoute";

const ID_KEY = "_id";

interface IProps {
  item: any;
  number: number;
  isFavorite: boolean;
  link: string;
  gridColumns: string;
  children: any;
  isFavButton?: boolean;
  toggleFavorite: () => void;
  type?: string;
  className?: string;
}

const getRouteIdentifier = (item: any, type?: string): string => {
  if (type === "backers-funds" || type === "persons" || type === "funds") {
    return getBackerRouteId(item);
  }

  if (typeof item?.[ID_KEY] === "object" && item?.[ID_KEY]?.$oid) {
    return String(item[ID_KEY].$oid);
  }

  return String(item?.[ID_KEY] || item?.id || item?.slug || "");
};

const getMarketRouteIdentifier = (item: any): string => {
  return String(
    item?.coingeckoId ||
      item?.providerIds?.coingeckoId ||
      item?.slug ||
      item?.marketAssetId ||
      item?.[ID_KEY] ||
      ""
  ).trim();
};

const getEchoRouteIdentifier = (item: any): string => {
  return String(item?.slug || item?.sourceId || item?.id || item?.[ID_KEY] || "").trim();
};

const getProjectStatusRouteParam = (item: any): string => {
  const status = String(item?.status || "Active").trim();

  return encodeURIComponent(status || "Active");
};

const getRowRoute = (item: any, link: string, type?: string): string => {
  if (link === "/crypto/project") {
    const coingeckoId = getMarketRouteIdentifier(item);
    return coingeckoId ? `/market/${encodeURIComponent(coingeckoId)}` : "";
  }

  if (type === "projects-ico") {
    if (item?.projectType === "market" || item?.projectKind === "market" || item?.coingeckoId || item?.providerIds?.coingeckoId) {
      const coingeckoId = getMarketRouteIdentifier(item);
      return coingeckoId ? `/market/${encodeURIComponent(coingeckoId)}` : "";
    }

    const slug = getEchoRouteIdentifier(item);
    const statusParam = getProjectStatusRouteParam(item);

    return slug ? `/echo/${encodeURIComponent(slug)}?status=${statusParam}` : "";
  }

  if (type === "funding-feed" || type === "unlocking") {
    const cryptoProjectRoute = resolveCryptoEntityProjectRoute(item);
    if (cryptoProjectRoute) return cryptoProjectRoute;
  }

  const routeIdentifier = getRouteIdentifier(item, type);
  return link && routeIdentifier ? `${link}/${routeIdentifier}` : "";
};

const UniversalTableRow: FC<IProps> = ({
  item,
  number,
  isFavorite,
  link,
  gridColumns,
  toggleFavorite,
  isFavButton,
  children,
  type,
  className,
}) => {
  const router = useRouter();

  const navigate = (e: any): void => {
    if (e.target.id === "favorite") {
      toggleFavorite();
      return;
    }

    if (e.target.id !== "link") {
      const route = getRowRoute(item, link, type);
      if (route) router.push(route);
    }
  };

  return (
    <RowWrapper
      stickyIndex={isFavButton ? 3 : 1}
      gridColumns={gridColumns}
      onClick={navigate}
      variant="crypto"
      className={`${type} ${className}`}
    >
      {isFavButton ? <FavButton isFavorite={isFavorite} /> : null}
      {isFavButton ? <div>{number}</div> : null}
      {children}
    </RowWrapper>
  );
};

export default UniversalTableRow;
