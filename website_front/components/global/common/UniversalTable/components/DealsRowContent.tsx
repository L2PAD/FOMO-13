import React from "react";
import {
  getDealStatus,
  moment,
  simplifyAmount,
  sliceAddress,
  type UniversalTableCaseProps,
  upperCaseFirstLetter,
} from "./shared";
import { useTranslation } from "i18n";

const DealsRowContent = ({ item, type, userData }: UniversalTableCaseProps) => {
  const { t } = useTranslation();
  const participant =
    item?.counterparty ||
    (item?.buyer?._id === userData?._id ? item?.buyer : item?.creator);
  const participantName =
    participant?.username || participant?.twitterData?.username || participant?.wallet || "-";

  const isExpiredWaiting =
    new Date(item.date).getTime() < new Date().getTime() && item?.status === "waiting";
  const statusClass = isExpiredWaiting ? "Cancelled" : getDealStatus(item.status);
  const statusLabel = isExpiredWaiting
    ? t("deals.tableStatus.cancelled")
    : t(`deals.tableStatus.${statusClass.toLowerCase()}`, { defaultValue: statusClass });

  return (
    <>
      <div className={`row-default-value gray-color ${type !== "otc" && "blue-bg"} ${type}`}>
        #{item?.dealId || 0}
      </div>
      <div className="row-bold-value">{item?.name || "-"}</div>
      <div className="row-default-value">{item?.amount || 0}</div>
      <div
        className={
          item.type === "buy" ? "row-default-value green-color" : "row-default-value red-color"
        }
      >
        {t(`deals.type.${item?.type}`, { defaultValue: upperCaseFirstLetter(item?.type) })}
      </div>
      <div style={{ fontSize: "14px" }} className="row-default-value">
        {item?.ticker === "eth" ? `${item?.price} ETH` : `$${simplifyAmount(item?.price, 6)}`}
      </div>
      <div style={{ fontSize: "14px" }} className="row-default-value">
        {item?.ticker === "eth"
          ? `${Number(item?.price) * Number(item?.amount)} ETH`.length > 10
            ? sliceAddress(`${Number(item?.price) * Number(item?.amount)} ETH`)
            : `${Number(item?.price) * Number(item?.amount)} ETH`
          : `$${simplifyAmount(item?.price * item?.amount, 6)}`}
      </div>
      <div className="row-default-value green-color">
        @{participantName}
      </div>
      <div className="row-default-value">{moment(String(item?.lastStatusUpdate)).format("LLL")}</div>
      <div className={statusClass}>{statusLabel}</div>
    </>
  );
};

export default DealsRowContent;
