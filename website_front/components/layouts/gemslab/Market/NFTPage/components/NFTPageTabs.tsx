import React from "react";
import { toast } from "react-toastify";
import UserAvatar from "../../../../../global/common/UserAvatar";
import Tabs from "../../../../../global/Tabs";
import CopyIcon from "../../../../../global/Icons/CopyIcon";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  OfferActions,
  ChartWrapper,
  InfoRow,
  InfoRowCopyButton,
  InfoRowLabel,
  InfoRowText,
  InfoRowValue,
  InfoTable,
  OfferItem,
  OfferPrice,
  OfferRight,
  OfferStatus,
  OffersList,
  OfferTime,
  OfferUser,
  OfferUserInfo,
  OfferUserName,
  CancelButton,
  TabsContainer,
} from "../styles";
import {
  NFT_PAGE_TABS,
  NFTPageInfoRow,
  NFTPageOffer,
  NFTPagePricePoint,
  NFTPageTab,
} from "../types";
import { useTranslation } from "i18n";

interface NFTPageTabsProps {
  activeTab: NFTPageTab;
  onTabChange: (tab: NFTPageTab) => void;
  infoRows: NFTPageInfoRow[];
  priceData: NFTPagePricePoint[];
  offersData: NFTPageOffer[];
  pendingOfferId?: string | null;
  pendingOfferAction?: "cancel" | "confirm" | "buy" | null;
  onCancelOffer: (offerId: string) => void;
  onConfirmOffer: (offerId: string) => void;
  onBuyOffer: (offerId: string) => void;
}

type Translate = (key: string, options?: any) => string;

const copyValue = async (value: string | undefined, t: Translate) => {
  if (!value || typeof navigator === "undefined") {
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    toast.success(t("nftMarket.offer.copied"));
  } catch (error) {
    toast.error(t("nftMarket.offer.copyFailed"));
  }
};

const renderInfoTable = (infoRows: NFTPageInfoRow[], t: Translate) => (
  <InfoTable>
    {infoRows.map((row) => (
      <InfoRow key={row.label}>
        <InfoRowLabel>{row.label}</InfoRowLabel>
        <InfoRowValue className={row.copyValue ? "copyable" : ""}>
          <InfoRowText
            title={typeof row.value === "string" ? row.copyValue || row.value : undefined}
          >
            {row.value}
          </InfoRowText>
          {row.copyValue ? (
            <InfoRowCopyButton
              aria-label={t("nftMarket.offer.copyLabel", { values: { label: row.label } })}
              onClick={() => {
                void copyValue(row.copyValue, t);
              }}
              type="button"
            >
              <CopyIcon fill="#738094" />
            </InfoRowCopyButton>
          ) : null}
        </InfoRowValue>
      </InfoRow>
    ))}
  </InfoTable>
);

const renderPriceChart = (data: NFTPagePricePoint[], t: Translate) => (
  <ChartWrapper>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid stroke="3 3" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          padding={{ left: 10, right: 10 }}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          domain={["auto", "auto"]}
          axisLine={false}
          tickLine={false}
          tickMargin={10}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          formatter={(value: number, _name, payload) => [
            `$${Number(value || 0).toFixed(2)}`,
            t("nftMarket.activity.price"),
          ]}
          contentStyle={{
            background: "#fff",
            border: "1px solid #f0f2f5",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
          labelStyle={{ color: "#000", fontSize: 12 }}
          itemStyle={{
            color: "#000",
            fontSize: 14,
            fontWeight: "var(--font-weight-semibold)",
          }}
        />
        <Line
          type="monotone"
          dataKey="priceUsd"
          stroke="#277AD2"
          strokeWidth={2}
          dot={{
            fill: "#fff",
            stroke: "#277AD2",
            strokeWidth: 2,
            r: 5,
          }}
          activeDot={{
            fill: "#277AD2",
            stroke: "#fff",
            strokeWidth: 2,
            r: 6,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  </ChartWrapper>
);

const renderOffers = (
  offersData: NFTPageOffer[],
  pendingOfferId: string | null | undefined,
  pendingOfferAction: "cancel" | "confirm" | "buy" | null | undefined,
  onCancelOffer: (offerId: string) => void,
  onConfirmOffer: (offerId: string) => void,
  onBuyOffer: (offerId: string) => void,
  t: Translate
) => (
  <OffersList>
    {offersData.map((offer) => (
      <OfferItem key={offer.id}>
        <OfferUser>
          <UserAvatar
            avatar={offer.avatar}
            variant="default"
            size="small"
            name={offer.userName}
          />
          <OfferUserInfo>
            <OfferUserName>{offer.userName}</OfferUserName>
            <OfferPrice>
              {offer.currency} {offer.price}{" "}
              <span>(${offer.priceUSD.toFixed(2)})</span>
            </OfferPrice>
          </OfferUserInfo>
        </OfferUser>
        <OfferRight>
          <OfferActions>
            {offer.canConfirm ? (
              <CancelButton
                disabled={
                  pendingOfferId === offer.id && pendingOfferAction === "confirm"
                }
                onClick={() => onConfirmOffer(offer.id)}
                type="button"
              >
                {pendingOfferId === offer.id && pendingOfferAction === "confirm"
                  ? t("nftMarket.offer.confirming")
                  : t("common.actions.accept")}
              </CancelButton>
            ) : null}
            {offer.canBuy ? (
              <CancelButton
                disabled={
                  pendingOfferId === offer.id && pendingOfferAction === "buy"
                }
                onClick={() => onBuyOffer(offer.id)}
                type="button"
              >
                {pendingOfferId === offer.id && pendingOfferAction === "buy"
                  ? t("nftMarket.offer.buying")
                  : t("common.actions.buy")}
              </CancelButton>
            ) : null}
            {offer.canCancel ? (
              <CancelButton
                disabled={
                  pendingOfferId === offer.id && pendingOfferAction === "cancel"
                }
                onClick={() => onCancelOffer(offer.id)}
                type="button"
              >
                {pendingOfferId === offer.id && pendingOfferAction === "cancel"
                  ? t("nftMarket.offer.canceling")
                  : t("common.actions.cancel")}
              </CancelButton>
            ) : null}
          </OfferActions>
          <OfferStatus>
            {t(`nftMarket.offer.statusLabel.${String(offer.status).toLowerCase()}`, {
              defaultValue: offer.status,
            })}
          </OfferStatus>
          <OfferTime>{offer.time}</OfferTime>
        </OfferRight>
      </OfferItem>
    ))}
  </OffersList>
);

const renderTabContent = (
  activeTab: NFTPageTab,
  infoRows: NFTPageInfoRow[],
  chartData: NFTPagePricePoint[],
  offersData: NFTPageOffer[],
  pendingOfferId: string | null | undefined,
  pendingOfferAction: "cancel" | "confirm" | "buy" | null | undefined,
  onCancelOffer: (offerId: string) => void,
  onConfirmOffer: (offerId: string) => void,
  onBuyOffer: (offerId: string) => void,
  t: Translate
) => {
  switch (activeTab) {
    case "Info":
      return renderInfoTable(infoRows, t);
    case "Price":
      return renderPriceChart(chartData, t);
    case "Offers":
      return renderOffers(
        offersData,
        pendingOfferId,
        pendingOfferAction,
        onCancelOffer,
        onConfirmOffer,
        onBuyOffer,
        t
      );
    default:
      return null;
  }
};

export const NFTPageTabs: React.FC<NFTPageTabsProps> = ({
  activeTab,
  onTabChange,
  infoRows,
  priceData,
  offersData,
  pendingOfferId,
  pendingOfferAction,
  onCancelOffer,
  onConfirmOffer,
  onBuyOffer,
}) => {
  const { t } = useTranslation();

  return (
    <TabsContainer>
      <Tabs
        className="nft-page"
        items={[...NFT_PAGE_TABS]}
        activeItem={activeTab}
        onClick={(tab) => onTabChange(tab as NFTPageTab)}
      />
      <div style={{ padding: "20px 0" }}>
        {renderTabContent(
          activeTab,
          infoRows,
          priceData,
          offersData,
          pendingOfferId,
          pendingOfferAction,
          onCancelOffer,
          onConfirmOffer,
          onBuyOffer,
          t
        )}
      </div>
    </TabsContainer>
  );
};
