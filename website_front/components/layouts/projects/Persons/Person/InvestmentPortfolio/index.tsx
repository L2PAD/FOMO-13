import React, { FC, useEffect, useMemo, useState } from "react";
import UserAvatar from "../../../../../global/common/UserAvatar";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import PercentValue from "../../../../../global/common/PercentValue";
import imageLoader from "../../../../../../helpers/imageLoader";
import { Body, Header, Row, Wrapper } from "./styles";
import Pagination from "../../../../../global/Pagintaion";
import { IFund, IPerson } from "../../../../../../types/global_types";
import EmptySection from "../../../../../global/EmptySection";
import moment from "moment";
import AddPortfolioItem, { IPersonPortfolioItem } from "../AddPortfolioItem";
import { ProfileTableScroll as Overflow } from "../../../shared/ProfilePageShell";
import PlaceholderTable from "../../../../../global/common/PlaceholderTable";

interface IProps {
  itemData: IPerson | IFund;
  itemDataToUpdate: IPerson | IFund | null;
  isEditState: boolean;
  portfolioItems?: Array<any>;
  isLoading?: boolean;
  currentPage?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  variant?: "default" | "fundRounds";
  onChange: (name: string, value: any) => void;
}

const limit = 10;

const formatPortfolioDate = (
  item: IPersonPortfolioItem,
  showDateWhenPresent = false
): string => {
  if (
    !showDateWhenPresent &&
    (item.status !== "Exit" || !item.exitDate || String(item.exitDate) === "-")
  ) {
    return "-";
  }

  if (!item.exitDate || String(item.exitDate) === "-") return "-";

  const date = moment(item.exitDate);

  return date.isValid() ? date.format("ll") : "-";
};

const formatProjectPrice = (value: any): string => {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return "-";

  return `$${clarifyAmount(price, false, undefined, 4)}`;
};

const formatUsdMetric = (value: any): string => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "-";

  return `$${clarifyAmount(amount, true)}`;
};

const toFiniteNumber = (value: any): number | undefined => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
};

const getPortfolioItemKey = (item: any, index: number): string => {
  const asset = item.asset || item.project || item;
  const { _id: assetObjectId } = asset;

  return String(
    asset.id ||
      assetObjectId ||
      asset.slug ||
      asset.marketAssetId ||
      asset.canonicalProjectId ||
      asset.name ||
      index
  );
};

const getAssetSubtitle = (asset: any): string => {
  const symbol = String(asset?.symbol || "").trim();

  return symbol ? symbol.toUpperCase() : asset?.category || asset?.niche || "";
};

const InvestmentPortfolio: FC<IProps> = ({
  itemData,
  itemDataToUpdate,
  isEditState,
  portfolioItems,
  isLoading = false,
  currentPage = 1,
  pageSize = 20,
  total,
  onPageChange,
  variant = "default",
  onChange,
}) => {
  const [page, setPage] = useState(1);
  const isFundRounds = variant === "fundRounds";
  const columnsStyle = isFundRounds
    ? { gridTemplateColumns: "1.7fr 0.85fr 0.85fr 1fr 1fr 0.9fr" }
    : undefined;
  const itemsToShow = useMemo(() => {
    const fallbackItems = itemData.investmentPorfolio || [];

    return isFundRounds ? portfolioItems || fallbackItems : fallbackItems;
  }, [isFundRounds, itemData.investmentPorfolio, portfolioItems]);
  const fundTotal = Number(total || itemsToShow.length);
  const totalPage = isFundRounds
    ? Math.max(1, Math.ceil(fundTotal / pageSize))
    : Math.max(1, Math.ceil(itemsToShow.length / limit));
  const paginatedItems = useMemo(() => {
    if (isFundRounds) return itemsToShow;

    const start = (page - 1) * limit;

    return itemsToShow.slice(start, start + limit);
  }, [isFundRounds, page, itemsToShow]);

  useEffect(() => {
    if (page > totalPage) setPage(totalPage);
  }, [page, totalPage]);

  return (
    <Overflow>
      <Wrapper variant="main">
        <Header style={columnsStyle}>
          {isFundRounds ? (
            <>
              <div>Asset</div>
              <div>Price</div>
              <div>Change 24H</div>
              <div>Market Cap</div>
              <div>FDV</div>
              <div>Average ROI</div>
            </>
          ) : (
            <>
              <div>Project Name</div>
              <div>Invested Round</div>
              <div>Amount Invested</div>
              <div>Current ROI</div>
              <div>Status</div>
              <div>Exit Date</div>
              <div>Exit ROI</div>
            </>
          )}
        </Header>
        <Body>
          {itemsToShow.length ? (
            paginatedItems.map((item, i: number) => {
              const { status } = item;
              const asset = item.asset || item.project || item;
              const change24h = toFiniteNumber(item.change24h ?? asset.change24h);
              const averageRoi = toFiniteNumber(
                item.averageRoi ?? item.roi ?? asset.averageRoi ?? asset.roi
              );

              return isFundRounds ? (
                <Row
                  key={getPortfolioItemKey(item, i)}
                  style={columnsStyle}
                >
                  <div className="project">
                    <UserAvatar
                      avatar={imageLoader(String(asset?.logo || asset?.image || ""))}
                      name={asset?.name || ""}
                      variant="default"
                      size="small"
                    />
                    <div className="project-info">
                      <div>{asset?.name || ""}</div>
                      <span>{getAssetSubtitle(asset)}</span>
                    </div>
                  </div>
                  <div className="bold">
                    {formatProjectPrice(item.price ?? asset.price)}
                  </div>
                  <div className="roi">
                    {change24h !== undefined ? (
                      <PercentValue
                        value={change24h}
                        size="small"
                        isLabel={change24h !== 0}
                        isIcon={false}
                        rightLabel="%"
                        neutralWhenZero
                      />
                    ) : (
                      <>-</>
                    )}
                  </div>
                  <div className="bold">
                    {formatUsdMetric(item.marketCap ?? asset.marketCap)}
                  </div>
                  <div className="bold">
                    {formatUsdMetric(
                      item.fdv ?? item.fullyDilutedMarketCap ?? asset.fdv ?? asset.fullyDilutedMarketCap
                    )}
                  </div>
                  <div className="roi">
                    {averageRoi ? (
                      <PercentValue
                        value={averageRoi}
                        size="small"
                        isLabel={false}
                        isIcon={false}
                        rightLabel="x"
                      />
                    ) : (
                      <>-</>
                    )}
                  </div>
                </Row>
              ) : (
                <Row key={i} style={columnsStyle}>
                  <div className="project">
                    <UserAvatar
                      avatar={imageLoader(String(item?.project?.logo))}
                      name={item?.project?.name || ""}
                      variant="default"
                      size="small"
                    />
                    <div className="project-info">
                      <div>{item?.project?.name || ""}</div>
                      <span>{item?.project?.niche || ""}</span>
                    </div>
                  </div>
                  {isFundRounds ? (
                    <div className="bold">
                      {formatProjectPrice(item?.project?.price)}
                    </div>
                  ) : null}
                  <div className="value">{item.investedRound || "-"}</div>
                  <div className="bold">
                    {item.investedAmount
                      ? `$${clarifyAmount(item.investedAmount)}`
                      : "-"}
                  </div>
                  <div className="roi">
                    {item.currentRoi ? (
                      <PercentValue
                        value={item.currentRoi}
                        size="small"
                        isLabel={false}
                        isIcon={false}
                        rightLabel="x"
                      />
                    ) : (
                      <>-</>
                    )}
                  </div>
                  <div className={`status ${status}`}>{status}</div>
                  <div className="value">
                    {formatPortfolioDate(item, false)}
                  </div>
                  <div className="roi">
                    {item.exitRoi ? (
                      <PercentValue
                        value={item.exitRoi}
                        size="small"
                        isLabel={false}
                        isIcon={false}
                        rightLabel="x"
                      />
                    ) : (
                      <>-</>
                    )}
                  </div>
                </Row>
              );
            })
          ) : isLoading ? (
            <PlaceholderTable height="48px" />
          ) : (
            <>
              <br />
              <br />
              <EmptySection />
              <br />
            </>
          )}
        </Body>
      </Wrapper>
      {!isFundRounds && itemsToShow.length > limit ? (
        <Pagination
          page={page}
          total={itemsToShow.length}
          limit={Math.min(page * limit, itemsToShow.length)}
          onePageLimit={limit}
          totalPage={totalPage}
          onChange={setPage}
          style={{ marginTop: "20px" }}
        />
      ) : (
        null
      )}
      {isFundRounds && fundTotal > pageSize ? (
        <Pagination
          page={currentPage}
          total={fundTotal}
          limit={Math.min(currentPage * pageSize, fundTotal)}
          onePageLimit={pageSize}
          totalPage={totalPage}
          onChange={onPageChange || (() => undefined)}
          style={{ marginTop: "20px" }}
        />
      ) : (
        null
      )}
      {isEditState && !isFundRounds ? (
        <AddPortfolioItem
          items={itemDataToUpdate?.investmentPorfolio || []}
          onChange={(items: Array<IPersonPortfolioItem>) =>
            onChange("investmentPorfolio", items)
          }
        />
      ) : (
        null
      )}
    </Overflow>
  );
};

export default InvestmentPortfolio;
