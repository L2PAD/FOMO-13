import React from "react";
import { ProjectData, UserAvatar, type UniversalTableCaseProps } from "./shared";
import { useTranslation } from "i18n";

const OrdersRowContent = ({ item }: UniversalTableCaseProps) => {
  const { t } = useTranslation();
  const status = String(item.status || "");
  const statusKey = status.toLowerCase();
  const statusLabel = t(`orders.status.${statusKey}`, {
    defaultValue: status || "-",
  });

  return (
    <>
      <div className="orders id">{item._id}</div>
      <ProjectData>
        <UserAvatar
          size="small"
          variant="default"
          avatar={String(item?.project?.logo || "")}
          name={item?.project?.name}
          fallbackType="project"
        />
        <div className="project-row-data">
          <p>
            {(item?.project?.name?.length || 0) > 20
              ? `${item?.project?.name?.slice(0, 15)}...`
              : item?.project?.name}
          </p>
          <span
            style={{
              fontSize: 14,
            }}
          >
            {item?.project.type}
          </span>
        </div>
      </ProjectData>
      <div className="orders">{item.allocSize}</div>
      <div className="orders">{item.orderType}</div>
      <div className="orders">{item.date}</div>
      <div className={`orders ${statusKey}`}>{statusLabel}</div>
    </>
  );
};

export default OrdersRowContent;
